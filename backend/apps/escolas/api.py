"""SaaS endpoints under `/api/saas/` for turmas, alunos, professores, ranking."""
from __future__ import annotations

import logging
from typing import List

from django.db import IntegrityError, transaction
from django.db.models import Count, Q
from ninja import File, Router
from ninja.errors import HttpError
from ninja.files import UploadedFile

from apps.accounts.auth import (
    jwt_auth,
    require_coordenador,
    require_docente,
)
from apps.accounts.models import Usuario
from apps.accounts.pagination import paginate
from apps.accounts.services import gerar_senha_provisoria
from apps.atividades.models import Atividade, NotaAtividadeAluno
from apps.escolas.models import Escola, ProfessorTurma, Turma
from apps.escolas.schemas import (
    AlunoOut,
    CadastroAlunoIn,
    CadastroAlunoOut,
    CadastroMassaOut,
    CadastroProfessorIn,
    CadastroProfessorOut,
    CadastroTurmaIn,
    HistoricoAlunoItem,
    MessageOut,
    ProfessorOut,
    RankingAtivoIn,
    RankingItem,
    RankingOut,
    RelatorioCadastroOut,
    TransferirAlunoIn,
    TurmaOut,
    TurmaProfessorOut,
    VinculoTurmaIn,
)
from apps.escolas.services import (
    assert_coordenador_da_escola,
    assert_pode_operar_turma,
    get_turma_or_403,
    turmas_do_usuario,
)
from apps.submissoes.models import Submissao, RelatorioCadastroMassa
from services.pdf_service import validar_upload_pdf

logger = logging.getLogger("skillflow.escolas")
saas_escolas_router = Router(tags=["saas-escolas"], auth=jwt_auth)


# --------------------------------------------------------------------- Turmas
def _turma_to_out(t: Turma) -> dict:
    return {
        "id": t.id,
        "nome": t.nome,
        "escola_id": t.escola_id,
        "escola_nome": t.escola.nome,
        "ranking_pontuacao_ativo": t.ranking_pontuacao_ativo,
        "ranking_provas_ativo": t.ranking_provas_ativo,
        "qtd_alunos": getattr(t, "qtd_alunos_pre", t.alunos.count()),
        "qtd_atividades": getattr(t, "qtd_atividades_pre", t.atividades.count()),
    }


@saas_escolas_router.get("/turmas/", response=dict)
def listar_turmas(request):
    user = require_docente(request)
    qs = (
        turmas_do_usuario(user)
        .select_related("escola")
        .annotate(
            qtd_alunos_pre=Count("alunos", distinct=True),
            qtd_atividades_pre=Count("atividades", distinct=True),
        )
    )
    return paginate(request, qs, _turma_to_out)


@saas_escolas_router.get(
    "/turmas/{turma_id}/", response={200: TurmaOut, 403: MessageOut, 404: MessageOut}
)
def detalhe_turma(request, turma_id: int):
    """Detail of a single turma — needed by the SaaS frontend turma view."""
    user = require_docente(request)
    turma = get_turma_or_403(user, turma_id)
    return _turma_to_out(turma)


@saas_escolas_router.post(
    "/turmas/",
    response={201: TurmaOut, 400: MessageOut, 403: MessageOut, 409: MessageOut},
)
def cadastrar_turma(request, payload: CadastroTurmaIn):
    """Coordenador-only: create a new Turma bound to the user's Escola.

    The school is inferred from `request.user.escola_id`, so the coordinator
    can only create classes inside their own tenant. Names are uniquely
    constrained per escola — duplicates yield a 409.
    """
    user = require_coordenador(request)
    if not user.escola_id:
        raise HttpError(403, "Coordenador sem escola vinculada.")
    nome = (payload.nome or "").strip()
    if not nome:
        raise HttpError(400, "Nome da turma é obrigatório.")
    try:
        turma = Turma.objects.create(nome=nome, escola_id=user.escola_id)
    except IntegrityError as exc:
        raise HttpError(409, "Já existe uma turma com este nome nesta escola.") from exc
    return 201, _turma_to_out(turma)


@saas_escolas_router.get("/turmas/{turma_id}/alunos/", response=dict)
def listar_alunos_da_turma(request, turma_id: int):
    user = require_docente(request)
    turma = get_turma_or_403(user, turma_id)
    qs = turma.alunos.all().select_related("turma")

    def to_out(a: Usuario) -> dict:
        return {
            "id": a.id,
            "nome": (f"{a.first_name} {a.last_name}").strip() or a.email,
            "email": a.email,
            "turma_id": a.turma_id,
            "turma_nome": a.turma.nome if a.turma else None,
            "escola_id": a.turma.escola_id if a.turma else None,
            "senha_provisoria": a.senha_provisoria,
            "media_geral_ponderada": Atividade.calcular_media_geral_aluno(a, turma),
        }

    return paginate(request, qs, to_out)


@saas_escolas_router.get("/alunos/", response=dict)
def buscar_alunos_da_escola(request):
    """Coordenador-only: search alunos of the escola by nome or email."""
    user = require_coordenador(request)
    q = request.GET.get("q", "").strip()
    qs = Usuario.objects.filter(
        role=Usuario.Role.ALUNO, turma__escola_id=user.escola_id
    ).select_related("turma", "turma__escola")
    if q:
        qs = qs.filter(
            Q(first_name__icontains=q)
            | Q(last_name__icontains=q)
            | Q(email__icontains=q)
        )

    def to_out(a: Usuario) -> dict:
        return {
            "id": a.id,
            "nome": (f"{a.first_name} {a.last_name}").strip() or a.email,
            "email": a.email,
            "turma_id": a.turma_id,
            "turma_nome": a.turma.nome if a.turma else None,
            "escola_id": a.turma.escola_id if a.turma else None,
            "senha_provisoria": a.senha_provisoria,
        }

    return paginate(request, qs, to_out)


@saas_escolas_router.post(
    "/turmas/{turma_id}/alunos/cadastrar/",
    response={201: CadastroAlunoOut, 409: MessageOut, 403: MessageOut},
)
def cadastrar_aluno(request, turma_id: int, payload: CadastroAlunoIn):
    user = require_docente(request)
    turma = get_turma_or_403(user, turma_id)
    if Usuario.objects.filter(email__iexact=payload.email).exists():
        raise HttpError(409, "E-mail já cadastrado.")
    senha = gerar_senha_provisoria()
    nome = payload.nome.strip()
    first_name, _, last_name = nome.partition(" ")
    aluno = Usuario.objects.create_user(
        email=payload.email.strip().lower(),
        password=senha,
        username=payload.email.strip().lower(),
        first_name=first_name,
        last_name=last_name,
        role=Usuario.Role.ALUNO,
        turma=turma,
        senha_provisoria=True,
    )
    return 201, {
        "id": aluno.id,
        "nome": nome,
        "email": aluno.email,
        "senha_provisoria": senha,
    }


@saas_escolas_router.post(
    "/turmas/{turma_id}/alunos/cadastrar-massa/",
    response={202: CadastroMassaOut, 400: MessageOut, 403: MessageOut},
)
def cadastrar_alunos_em_massa(
    request, turma_id: int, pdf: UploadedFile = File(...)
):
    user = require_docente(request)
    turma = get_turma_or_403(user, turma_id)
    validar_upload_pdf(
        pdf,
        max_bytes=10 * 1024 * 1024,
        rotulo="Cadastro em massa",
    )
    relatorio = RelatorioCadastroMassa.objects.create(
        turma=turma,
        solicitado_por=user,
        pdf_original=pdf,
        status=RelatorioCadastroMassa.Status.PROCESSANDO,
    )
    from tasks.cadastro_massa import cadastrar_alunos_massa_pdf

    cadastrar_alunos_massa_pdf.delay(relatorio.id)
    return 202, {"relatorio_id": relatorio.id, "status": relatorio.status}


@saas_escolas_router.get(
    "/relatorios-cadastro/{relatorio_id}/", response=RelatorioCadastroOut
)
def consultar_relatorio_cadastro(request, relatorio_id: int):
    user = require_docente(request)
    relatorio = (
        RelatorioCadastroMassa.objects.select_related("turma", "turma__escola")
        .filter(id=relatorio_id)
        .first()
    )
    if relatorio is None:
        raise HttpError(404, "Relatório não encontrado.")
    assert_pode_operar_turma(user, relatorio.turma)
    return {
        "id": relatorio.id,
        "turma_id": relatorio.turma_id,
        "status": relatorio.status,
        "resultado": relatorio.resultado,
        "criado_em": relatorio.criado_em,
    }


@saas_escolas_router.put(
    "/alunos/{aluno_id}/transferir-turma/",
    response={200: AlunoOut, 403: MessageOut, 404: MessageOut},
)
def transferir_aluno(request, aluno_id: int, payload: TransferirAlunoIn):
    user = require_coordenador(request)
    aluno = (
        Usuario.objects.filter(id=aluno_id, role=Usuario.Role.ALUNO)
        .select_related("turma", "turma__escola")
        .first()
    )
    if aluno is None or (aluno.turma and aluno.turma.escola_id != user.escola_id):
        raise HttpError(404, "Aluno não encontrado nesta escola.")
    nova_turma = Turma.objects.filter(id=payload.nova_turma_id).first()
    if not nova_turma or nova_turma.escola_id != user.escola_id:
        raise HttpError(403, "A nova turma não pertence à sua escola.")
    aluno.turma = nova_turma
    aluno.save(update_fields=["turma", "updated_at"])
    return {
        "id": aluno.id,
        "nome": (f"{aluno.first_name} {aluno.last_name}").strip() or aluno.email,
        "email": aluno.email,
        "turma_id": aluno.turma_id,
        "turma_nome": aluno.turma.nome if aluno.turma else None,
        "escola_id": aluno.turma.escola_id if aluno.turma else None,
        "senha_provisoria": aluno.senha_provisoria,
    }


# ---------------------------------------------------------------- Professores
@saas_escolas_router.get("/professores/", response=dict)
def listar_professores(request):
    """Coordenador-only listagem dos professores vinculados à escola.

    Retorna paginado, com lista de turmas vinculadas à escola do coordenador,
    para alimentar o painel `/dashboard/professores` do frontend.
    """
    user = require_coordenador(request)
    qs = (
        Usuario.objects.filter(
            role=Usuario.Role.PROFESSOR,
            vinculos_turma__turma__escola_id=user.escola_id,
        )
        .distinct()
        .order_by("first_name", "email")
    )

    def to_out(p: Usuario) -> dict:
        turmas = list(
            Turma.objects.filter(
                escola_id=user.escola_id,
                vinculos_professor__professor=p,
            ).distinct().values("id", "nome")
        )
        return {
            "id": p.id,
            "nome": (f"{p.first_name} {p.last_name}").strip() or p.email,
            "email": p.email,
            "qtd_turmas": len(turmas),
            "turmas": [{"id": t["id"], "nome": t["nome"]} for t in turmas],
            "senha_provisoria": p.senha_provisoria,
        }

    return paginate(request, qs, to_out)


@saas_escolas_router.post(
    "/professores/cadastrar/",
    response={201: CadastroProfessorOut, 409: MessageOut, 403: MessageOut},
)
def cadastrar_professor(request, payload: CadastroProfessorIn):
    user = require_coordenador(request)
    if Usuario.objects.filter(email__iexact=payload.email).exists():
        raise HttpError(409, "E-mail já cadastrado.")
    senha = gerar_senha_provisoria()
    nome = payload.nome.strip()
    first_name, _, last_name = nome.partition(" ")
    professor = Usuario.objects.create_user(
        email=payload.email.strip().lower(),
        password=senha,
        username=payload.email.strip().lower(),
        first_name=first_name,
        last_name=last_name,
        role=Usuario.Role.PROFESSOR,
        senha_provisoria=True,
    )
    return 201, {
        "id": professor.id,
        "nome": nome,
        "email": professor.email,
        "senha_provisoria": senha,
    }


@saas_escolas_router.get(
    "/professores/{professor_id}/turmas/",
    response=List[TurmaProfessorOut],
)
def listar_turmas_professor(request, professor_id: int):
    user = require_coordenador(request)
    professor = Usuario.objects.filter(
        id=professor_id, role=Usuario.Role.PROFESSOR
    ).first()
    if professor is None:
        raise HttpError(404, "Professor não encontrado.")
    turmas = Turma.objects.filter(
        escola_id=user.escola_id,
        vinculos_professor__professor=professor,
    ).distinct()
    return [
        {"id": t.id, "nome": t.nome, "escola_id": t.escola_id} for t in turmas
    ]


@saas_escolas_router.post(
    "/professores/{professor_id}/vincular-turma/",
    response={201: MessageOut, 403: MessageOut, 409: MessageOut},
)
def vincular_professor(request, professor_id: int, payload: VinculoTurmaIn):
    user = require_coordenador(request)
    professor = Usuario.objects.filter(
        id=professor_id, role=Usuario.Role.PROFESSOR
    ).first()
    if professor is None:
        raise HttpError(404, "Professor não encontrado.")
    turma = Turma.objects.filter(id=payload.turma_id).first()
    if not turma or turma.escola_id != user.escola_id:
        raise HttpError(403, "Turma fora da sua escola.")
    try:
        ProfessorTurma.objects.create(professor=professor, turma=turma)
    except IntegrityError:
        raise HttpError(409, "Vínculo já existe.")
    return 201, {"detail": "Vínculo criado."}


@saas_escolas_router.delete(
    "/professores/{professor_id}/desvincular-turma/",
    response={200: MessageOut, 403: MessageOut, 404: MessageOut},
)
def desvincular_professor(request, professor_id: int, payload: VinculoTurmaIn):
    user = require_coordenador(request)
    turma = Turma.objects.filter(id=payload.turma_id).first()
    if not turma or turma.escola_id != user.escola_id:
        raise HttpError(403, "Turma fora da sua escola.")
    deleted, _ = ProfessorTurma.objects.filter(
        professor_id=professor_id, turma=turma
    ).delete()
    if not deleted:
        raise HttpError(404, "Vínculo não encontrado.")
    return {"detail": "Vínculo removido."}


@saas_escolas_router.get(
    "/alunos/{aluno_id}/historico/", response=List[HistoricoAlunoItem]
)
def historico_aluno_cross_turma(request, aluno_id: int):
    user = require_coordenador(request)
    aluno = (
        Usuario.objects.filter(id=aluno_id, role=Usuario.Role.ALUNO)
        .select_related("turma", "turma__escola")
        .first()
    )
    if aluno is None or (aluno.turma and aluno.turma.escola_id != user.escola_id):
        raise HttpError(404, "Aluno não encontrado nesta escola.")
    submissoes = (
        Submissao.objects.filter(aluno=aluno)
        .select_related(
            "exercicio",
            "exercicio__atividade",
            "exercicio__atividade__turma",
        )
        .order_by("-criado_em")
    )
    return [
        {
            "submissao_id": s.id,
            "atividade_id": s.exercicio.atividade_id,
            "atividade_titulo": s.exercicio.atividade.titulo,
            "tipo_atividade": s.exercicio.atividade.tipo_atividade,
            "turma_id": s.exercicio.atividade.turma_id,
            "turma_nome": s.exercicio.atividade.turma.nome,
            "nota": s.nota_final,
            "status": s.status,
            "criado_em": s.criado_em,
        }
        for s in submissoes
    ]


# ------------------------------------------------------------------- Ranking
@saas_escolas_router.put(
    "/turmas/{turma_id}/ranking/",
    response={200: TurmaOut, 403: MessageOut},
)
def atualizar_ranking(request, turma_id: int, payload: RankingAtivoIn):
    user = require_docente(request)
    turma = get_turma_or_403(user, turma_id)
    update_fields: list[str] = []
    if payload.ranking_pontuacao_ativo is not None:
        turma.ranking_pontuacao_ativo = payload.ranking_pontuacao_ativo
        update_fields.append("ranking_pontuacao_ativo")
    if payload.ranking_provas_ativo is not None:
        turma.ranking_provas_ativo = payload.ranking_provas_ativo
        update_fields.append("ranking_provas_ativo")
    if update_fields:
        update_fields.append("updated_at")
        turma.save(update_fields=update_fields)
    return _turma_to_out(turma)


@saas_escolas_router.get(
    "/turmas/{turma_id}/ranking/",
    response={200: RankingOut, 403: MessageOut},
)
def ver_ranking_saas(request, turma_id: int, tipo: str = "pontuacao"):
    from apps.atividades.services import construir_ranking

    user = require_docente(request)
    turma = get_turma_or_403(user, turma_id)
    return construir_ranking(turma, tipo, force=True)
