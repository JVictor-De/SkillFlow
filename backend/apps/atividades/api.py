"""Atividades, materiais and ranking endpoints (SaaS + App)."""
from __future__ import annotations

import logging
from datetime import timedelta
from typing import List, Optional

from django.db import transaction
from django.db.models import Count
from django.utils import timezone
from ninja import File, Router
from ninja.errors import HttpError
from ninja.files import UploadedFile

from apps.accounts.auth import (
    jwt_auth,
    require_aluno,
    require_docente,
)
from apps.accounts.pagination import paginate
from apps.atividades.models import (
    Atividade,
    Exercicio,
    MaterialApoio,
    NotaAtividadeAluno,
)
from apps.atividades.schemas import (
    AprovarAgendarIn,
    AtividadeDetailOut,
    AtividadeIn,
    AtividadeOut,
    AtividadeUpdateIn,
    ExercicioOut,
    ExercicioPublicOut,
    GerarIAIn,
    GerarIAOut,
    MaterialApoioOut,
    MessageOut,
    OverrideNotaAtividadeIn,
    PainelOut,
)
from apps.atividades.services import (
    construir_ranking,
    painel_aluno,
    queryset_atividades,
)
from apps.escolas.services import (
    assert_pode_operar_turma,
    get_turma_or_403,
    turmas_do_usuario,
)
from apps.submissoes.models import Submissao
from services.pdf_service import validar_upload_pdf

logger = logging.getLogger("skillflow.atividades")

saas_atividades_router = Router(tags=["saas-atividades"], auth=jwt_auth)
app_atividades_router = Router(tags=["app-atividades"], auth=jwt_auth)


# ----------------------------------------------------------- helpers (SaaS)
def _atividade_out(atv: Atividade, *, detail: bool = False) -> dict:
    out: dict = {
        "id": atv.id,
        "titulo": atv.titulo,
        "disciplina": atv.disciplina,
        "tipo_atividade": atv.tipo_atividade,
        "peso": atv.peso,
        "status_publicacao": atv.status_publicacao,
        "data_liberacao": atv.data_liberacao,
        "data_limite": atv.data_limite,
        "turma_id": atv.turma_id,
        "criado_em": atv.criado_em,
        "updated_at": atv.updated_at,
        "qtd_exercicios": atv.exercicios.count(),
    }
    if detail:
        out["exercicios"] = [
            {
                "id": e.id,
                "ordem": e.ordem,
                "tipo": e.tipo,
                "enunciado": e.enunciado,
                "alternativas": e.alternativas,
                "gabarito_esperado": e.gabarito_esperado,
            }
            for e in atv.exercicios.all()
        ]
    return out


def _persistir_exercicios(atividade: Atividade, exercicios: list) -> None:
    """Replace the activity's exercises with the provided list."""
    atividade.exercicios.all().delete()
    bulk = []
    for ex in exercicios:
        if ex.tipo == Exercicio.Tipo.MULTIPLA_ESCOLHA and not ex.alternativas:
            raise HttpError(
                400, "Exercícios de múltipla escolha exigem alternativas."
            )
        if ex.tipo in Exercicio.TIPOS_DISSERTATIVOS and ex.alternativas:
            raise HttpError(
                400, "Exercícios dissertativos não devem ter alternativas."
            )
        bulk.append(
            Exercicio(
                atividade=atividade,
                ordem=ex.ordem,
                tipo=ex.tipo,
                enunciado=ex.enunciado,
                gabarito_esperado=ex.gabarito_esperado,
                alternativas=ex.alternativas,
            )
        )
    Exercicio.objects.bulk_create(bulk)


# ----------------------------------------------------------- SaaS atividades
# IMPORTANT: routes with literal segments (e.g. /atividades/gerar-ia/) MUST be
# declared BEFORE parametric routes (/atividades/{atividade_id}/) so the URL
# resolver matches the literal first.


@saas_atividades_router.post(
    "/atividades/",
    response={201: AtividadeDetailOut, 400: MessageOut, 403: MessageOut},
)
def criar_atividade(request, payload: AtividadeIn):
    user = require_docente(request)
    turma = get_turma_or_403(user, payload.turma_id)
    if payload.tipo_atividade == Atividade.TipoAtividade.PROVA:
        if not payload.peso or payload.peso < 1:
            raise HttpError(400, "Provas exigem peso >= 1.")
    if payload.status_publicacao != "DRAFT":
        if not payload.data_liberacao or not payload.data_limite:
            raise HttpError(
                400, "data_liberacao e data_limite são obrigatórios fora de DRAFT."
            )
    with transaction.atomic():
        atividade = Atividade(
            titulo=payload.titulo,
            disciplina=payload.disciplina,
            tipo_atividade=payload.tipo_atividade,
            peso=payload.peso if payload.tipo_atividade == "PROVA" else 1,
            status_publicacao=payload.status_publicacao,
            data_liberacao=payload.data_liberacao,
            data_limite=payload.data_limite,
            turma=turma,
            criado_por=user,
        )
        atividade.full_clean()
        atividade.save()
        _persistir_exercicios(atividade, payload.exercicios)
    return 201, _atividade_out(atividade, detail=True)


@saas_atividades_router.post(
    "/atividades/gerar-ia/",
    response={202: GerarIAOut, 403: MessageOut, 404: MessageOut},
)
def gerar_atividade_ia(request, payload: GerarIAIn):
    user = require_docente(request)
    turma = get_turma_or_403(user, payload.turma_id)
    material = MaterialApoio.objects.filter(
        id=payload.material_id, turma=turma
    ).first()
    if material is None:
        raise HttpError(404, "Material não encontrado nesta turma.")
    if payload.tipo_atividade == Atividade.TipoAtividade.PROVA and (
        not payload.peso or payload.peso < 1
    ):
        raise HttpError(400, "Provas exigem peso >= 1.")
    atividade = Atividade.objects.create(
        titulo=payload.titulo,
        disciplina=payload.disciplina,
        tipo_atividade=payload.tipo_atividade,
        peso=payload.peso if payload.tipo_atividade == "PROVA" else 1,
        status_publicacao=Atividade.StatusPublicacao.DRAFT,
        turma=turma,
        criado_por=user,
    )
    from tasks.atividades import gerar_exercicios_ia

    gerar_exercicios_ia.delay(atividade.id, material.id, payload.quantidade)
    return 202, {"atividade_id": atividade.id, "status": "PROCESSANDO"}


@saas_atividades_router.put(
    "/atividades/{atividade_id}/aprovar-agendar/",
    response={200: AtividadeOut, 400: MessageOut, 403: MessageOut},
)
def aprovar_agendar(request, atividade_id: int, payload: AprovarAgendarIn):
    user = require_docente(request)
    atividade = Atividade.objects.filter(id=atividade_id).first()
    if atividade is None:
        raise HttpError(404, "Atividade não encontrada.")
    assert_pode_operar_turma(user, atividade.turma)
    if payload.data_limite <= payload.data_liberacao:
        raise HttpError(400, "data_limite deve ser posterior a data_liberacao.")
    novo_status = payload.status_publicacao
    if (
        novo_status == Atividade.StatusPublicacao.AGENDADO
        and payload.data_liberacao <= timezone.now()
    ):
        novo_status = Atividade.StatusPublicacao.PUBLICADO
    atividade.data_liberacao = payload.data_liberacao
    atividade.data_limite = payload.data_limite
    atividade.status_publicacao = novo_status
    atividade.full_clean()
    atividade.save()
    return _atividade_out(atividade)


@saas_atividades_router.put(
    "/atividades/{atividade_id}/override-nota-aluno/",
    response={200: MessageOut, 403: MessageOut, 404: MessageOut},
)
def override_nota_aluno(
    request, atividade_id: int, payload: OverrideNotaAtividadeIn
):
    user = require_docente(request)
    atividade = Atividade.objects.filter(id=atividade_id).first()
    if atividade is None:
        raise HttpError(404, "Atividade não encontrada.")
    assert_pode_operar_turma(user, atividade.turma)
    if not (0 <= payload.nota <= 100):
        raise HttpError(400, "Nota deve estar entre 0 e 100.")
    if not atividade.turma.alunos.filter(id=payload.aluno_id).exists():
        raise HttpError(403, "Aluno não pertence à turma desta atividade.")
    NotaAtividadeAluno.objects.update_or_create(
        aluno_id=payload.aluno_id,
        atividade=atividade,
        defaults={"nota_override": payload.nota, "override_por": user},
    )
    return {"detail": "Override aplicado."}


@saas_atividades_router.put(
    "/atividades/{atividade_id}/",
    response={200: AtividadeDetailOut, 400: MessageOut, 403: MessageOut},
)
def editar_atividade(request, atividade_id: int, payload: AtividadeUpdateIn):
    user = require_docente(request)
    atividade = Atividade.objects.filter(id=atividade_id).first()
    if atividade is None:
        raise HttpError(404, "Atividade não encontrada.")
    assert_pode_operar_turma(user, atividade.turma)
    if atividade.status_publicacao != Atividade.StatusPublicacao.DRAFT:
        # Only data_limite can be extended on published activities.
        if payload.data_limite is None:
            raise HttpError(
                400,
                "Atividades publicadas só permitem estender data_limite.",
            )
        if (
            atividade.data_liberacao
            and payload.data_limite <= atividade.data_liberacao
        ):
            raise HttpError(
                400, "data_limite deve ser posterior a data_liberacao."
            )
        atividade.data_limite = payload.data_limite
        atividade.save(update_fields=["data_limite", "updated_at"])
        return _atividade_out(atividade, detail=True)
    # DRAFT — accept any field.
    with transaction.atomic():
        if payload.titulo is not None:
            atividade.titulo = payload.titulo
        if payload.disciplina is not None:
            atividade.disciplina = payload.disciplina
        if payload.peso is not None and atividade.tipo_atividade == "PROVA":
            atividade.peso = payload.peso
        if payload.data_liberacao is not None:
            atividade.data_liberacao = payload.data_liberacao
        if payload.data_limite is not None:
            atividade.data_limite = payload.data_limite
        atividade.full_clean()
        atividade.save()
        if payload.exercicios is not None:
            _persistir_exercicios(atividade, payload.exercicios)
    return _atividade_out(atividade, detail=True)


@saas_atividades_router.put(
    "/atividades/{atividade_id}/fechar/",
    response={200: AtividadeOut, 400: MessageOut, 403: MessageOut},
)
def fechar_atividade(request, atividade_id: int):
    """Fechar uma atividade/prova para novas respostas.

    Implementação simples e alinhada à regra de negócio:
    o backend usa ``data_limite`` como gatilho para recusar submissões
    online (ver ``apps.submissoes.services.avaliar_prazo``). Fechar a
    prova significa antecipar ``data_limite`` para o instante atual e
    garantir que o status fique ``PUBLICADO`` (rascunhos não fazem
    sentido fechar).
    """
    user = require_docente(request)
    atividade = Atividade.objects.filter(id=atividade_id).first()
    if atividade is None:
        raise HttpError(404, "Atividade não encontrada.")
    assert_pode_operar_turma(user, atividade.turma)
    if atividade.status_publicacao == Atividade.StatusPublicacao.DRAFT:
        raise HttpError(
            400, "Atividades em rascunho não precisam ser fechadas."
        )
    agora = timezone.now()
    atividade.data_limite = agora
    if atividade.data_liberacao is None or atividade.data_liberacao > agora:
        # Garante consistência (data_limite > data_liberacao não é mais
        # exigida pela constraint quando ambas são iguais; recuamos a
        # liberação 1 segundo para satisfazer `clean()`).
        atividade.data_liberacao = agora - timedelta(seconds=1)
    atividade.status_publicacao = Atividade.StatusPublicacao.PUBLICADO
    atividade.save(
        update_fields=[
            "data_limite",
            "data_liberacao",
            "status_publicacao",
            "updated_at",
        ]
    )
    return _atividade_out(atividade)


@saas_atividades_router.delete(
    "/atividades/{atividade_id}/",
    response={200: MessageOut, 409: MessageOut, 403: MessageOut},
)
def excluir_atividade(request, atividade_id: int, force: bool = False):
    """Excluir atividade.

    Por padrão, atividades publicadas com submissões existentes não
    podem ser excluídas (retorna 409). O parâmetro de query ``force``
    permite ao docente excluir mesmo assim — Django lida com o cascade
    apagando submissões e exercícios. Útil para o fluxo "Excluir prova"
    quando o professor confirma a ação destrutiva no frontend.
    """
    user = require_docente(request)
    atividade = Atividade.objects.filter(id=atividade_id).first()
    if atividade is None:
        raise HttpError(404, "Atividade não encontrada.")
    assert_pode_operar_turma(user, atividade.turma)
    if atividade.status_publicacao != Atividade.StatusPublicacao.DRAFT:
        if (
            not force
            and Submissao.objects.filter(
                exercicio__atividade=atividade
            ).exists()
        ):
            raise HttpError(
                409,
                "Atividade publicada com submissões não pode ser excluída.",
            )
    atividade.delete()
    return {"detail": "Atividade excluída."}


@saas_atividades_router.get("/atividades/", response=dict)
def listar_atividades_saas(
    request, turma_id: int | None = None, tipo: str | None = None
):
    user = require_docente(request)
    qs = queryset_atividades(user, turma_id=turma_id)
    if tipo:
        qs = qs.filter(tipo_atividade=tipo.upper())
    return paginate(request, qs.order_by("-criado_em"), _atividade_out)


# ------------------------------------------------------------ SaaS materiais
def _material_arquivo_url(request, material: MaterialApoio) -> str:
    """Build absolute URL for the material PDF.

    Mesmo motivo descrito em ``apps.submissoes.api._absolute_media_url``:
    o frontend abre o link em nova aba e, sem o domínio da API embutido,
    o navegador resolve o caminho relativo na própria origem do Next.js
    e cai em 404. ``build_absolute_uri`` gera ``https://api.../media/...``
    em produção e ``http://localhost:8000/media/...`` localmente.
    """
    if not material.arquivo:
        return ""
    try:
        url = material.arquivo.url
    except ValueError:
        return ""
    return request.build_absolute_uri(url) if request is not None else url


@saas_atividades_router.post(
    "/turmas/{turma_id}/materiais/",
    response={201: MaterialApoioOut, 403: MessageOut, 400: MessageOut},
)
def upload_material(
    request,
    turma_id: int,
    titulo: str,
    arquivo: UploadedFile = File(...),
):
    user = require_docente(request)
    turma = get_turma_or_403(user, turma_id)
    validar_upload_pdf(
        arquivo, max_bytes=50 * 1024 * 1024, rotulo="Material de apoio"
    )
    material = MaterialApoio.objects.create(
        titulo=titulo,
        arquivo=arquivo,
        turma=turma,
        enviado_por=user,
    )
    return 201, {
        "id": material.id,
        "titulo": material.titulo,
        "arquivo_url": _material_arquivo_url(request, material),
        "turma_id": material.turma_id,
        "enviado_por_id": material.enviado_por_id,
        "criado_em": material.criado_em,
    }


@saas_atividades_router.get(
    "/turmas/{turma_id}/materiais/", response=dict
)
def listar_materiais(request, turma_id: int):
    user = require_docente(request)
    turma = get_turma_or_403(user, turma_id)
    qs = MaterialApoio.objects.filter(turma=turma).order_by("-criado_em")

    def to_out(m: MaterialApoio) -> dict:
        return {
            "id": m.id,
            "titulo": m.titulo,
            "arquivo_url": _material_arquivo_url(request, m),
            "turma_id": m.turma_id,
            "enviado_por_id": m.enviado_por_id,
            "criado_em": m.criado_em,
        }

    return paginate(request, qs, to_out)


# ----------------------------------------------------------------- App routes
@app_atividades_router.get("/painel/", response=PainelOut)
def painel(request):
    user = require_aluno(request)
    return painel_aluno(user)


@app_atividades_router.get("/atividades/", response=dict)
def listar_atividades_app(
    request,
    tipo: str | None = None,
    feitos: bool | None = None,
):
    """List the activities visible to the logged-in student.

    Each row carries an `is_completed` flag computed from the student's
    submissions, and the optional `feitos` query param lets the App switch
    between the "pending" tab (`feitos=false`) and the "Feitos" tab
    (`feitos=true`).
    """
    user = require_aluno(request)
    if user.turma_id is None:
        raise HttpError(403, "Aluno sem turma.")
    qs = (
        Atividade.objects.filter(
            turma_id=user.turma_id,
            status_publicacao=Atividade.StatusPublicacao.PUBLICADO,
            data_liberacao__lte=timezone.now(),
        )
        .order_by("-data_liberacao")
    )
    if tipo:
        qs = qs.filter(tipo_atividade=tipo.upper())

    # Bulk: total exercises per atividade in the student's turma.
    ex_count_map = dict(
        Exercicio.objects.filter(atividade__turma_id=user.turma_id)
        .values("atividade_id")
        .annotate(total=Count("id"))
        .values_list("atividade_id", "total")
    )
    # Bulk: how many of them this student has answered.
    sub_count_map = dict(
        Submissao.objects.filter(aluno=user)
        .values("exercicio__atividade_id")
        .annotate(total=Count("id"))
        .values_list("exercicio__atividade_id", "total")
    )
    completed_ids = {
        atividade_id
        for atividade_id, total_ex in ex_count_map.items()
        if total_ex > 0 and sub_count_map.get(atividade_id, 0) >= total_ex
    }

    if feitos is True:
        qs = qs.filter(id__in=completed_ids)
    elif feitos is False:
        qs = qs.exclude(id__in=completed_ids)

    def serializer(atv: Atividade) -> dict:
        out = _atividade_out(atv)
        out["is_completed"] = atv.id in completed_ids
        out["qtd_submetidos"] = sub_count_map.get(atv.id, 0)
        return out

    return paginate(request, qs, serializer)


@app_atividades_router.get(
    "/atividades/{atividade_id}/exercicios/",
    response=List[ExercicioPublicOut],
)
def listar_exercicios_app(request, atividade_id: int):
    user = require_aluno(request)
    atividade = Atividade.objects.filter(
        id=atividade_id,
        turma_id=user.turma_id,
        status_publicacao=Atividade.StatusPublicacao.PUBLICADO,
        data_liberacao__lte=timezone.now(),
    ).first()
    if atividade is None:
        raise HttpError(404, "Atividade não disponível.")
    return [
        {
            "id": e.id,
            "ordem": e.ordem,
            "tipo": e.tipo,
            "enunciado": e.enunciado,
            "alternativas": e.alternativas,
        }
        for e in atividade.exercicios.all()
    ]


@app_atividades_router.get("/turma/ranking/", response=dict)
def ranking_app(request, tipo: str = "pontuacao"):
    user = require_aluno(request)
    if user.turma_id is None:
        raise HttpError(403, "Aluno sem turma.")
    return construir_ranking(user.turma, tipo)
