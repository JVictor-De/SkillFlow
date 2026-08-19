"""Responsáveis routes — SaaS gestão (Coordenador-only) + App (boletim)."""
from __future__ import annotations

import logging
from typing import List

from django.db import IntegrityError
from django.db.models import Count
from ninja import Router
from ninja.errors import HttpError

from apps.accounts.auth import (
    jwt_auth,
    require_coordenador,
    require_responsavel,
)
from apps.accounts.models import Usuario
from apps.accounts.pagination import paginate
from apps.accounts.services import gerar_senha_provisoria
from apps.atividades.models import Atividade, NotaAtividadeAluno
from apps.responsaveis.models import ResponsavelAluno
from apps.responsaveis.schemas import (
    BoletimAtividadeItem,
    BoletimOut,
    CadastroResponsavelIn,
    CadastroResponsavelOut,
    FilhoOut,
    MessageOut,
    ResponsavelOut,
    VinculoAlunoIn,
)

logger = logging.getLogger("skillflow.responsaveis")

saas_responsaveis_router = Router(tags=["saas-responsaveis"], auth=jwt_auth)
app_responsavel_router = Router(tags=["app-responsavel"], auth=jwt_auth)


# ------------------------------------------------------ Cadastro / Listagem
@saas_responsaveis_router.post(
    "/responsaveis/cadastrar/",
    response={201: CadastroResponsavelOut, 409: MessageOut},
)
def cadastrar_responsavel(request, payload: CadastroResponsavelIn):
    user = require_coordenador(request)
    if Usuario.objects.filter(email__iexact=payload.email).exists():
        raise HttpError(409, "E-mail já cadastrado.")
    senha = gerar_senha_provisoria()
    nome = payload.nome.strip()
    first_name, _, last_name = nome.partition(" ")
    responsavel = Usuario.objects.create_user(
        email=payload.email.strip().lower(),
        password=senha,
        username=payload.email.strip().lower(),
        first_name=first_name,
        last_name=last_name,
        role=Usuario.Role.RESPONSAVEL,
        escola_id=user.escola_id,
        senha_provisoria=True,
    )
    return 201, {
        "id": responsavel.id,
        "nome": nome,
        "email": responsavel.email,
        "senha_provisoria": senha,
    }


@saas_responsaveis_router.get("/responsaveis/", response=dict)
def listar_responsaveis(request):
    user = require_coordenador(request)
    qs = (
        Usuario.objects.filter(
            role=Usuario.Role.RESPONSAVEL, escola_id=user.escola_id
        )
        .annotate(qtd_filhos_pre=Count("filhos_vinculados"))
        .order_by("first_name", "email")
    )

    def to_out(r: Usuario) -> dict:
        # Eagerly attach the linked alunos so the SaaS dashboard can render the
        # cards in a single round-trip, matching the frontend `ResponsavelResumo`
        # contract.
        vinculos = ResponsavelAluno.objects.filter(
            responsavel=r
        ).select_related("aluno", "aluno__turma")
        return {
            "id": r.id,
            "nome": (f"{r.first_name} {r.last_name}").strip() or r.email,
            "email": r.email,
            "qtd_filhos": getattr(r, "qtd_filhos_pre", 0),
            "alunos": [
                {
                    "id": v.aluno_id,
                    "nome": (
                        f"{v.aluno.first_name} {v.aluno.last_name}"
                    ).strip()
                    or v.aluno.email,
                    "turma_nome": v.aluno.turma.nome if v.aluno.turma else "",
                }
                for v in vinculos
            ],
        }

    return paginate(request, qs, to_out)


@saas_responsaveis_router.post(
    "/responsaveis/{responsavel_id}/vincular-aluno/",
    response={201: MessageOut, 403: MessageOut, 409: MessageOut, 404: MessageOut},
)
def vincular_aluno(request, responsavel_id: int, payload: VinculoAlunoIn):
    user = require_coordenador(request)
    responsavel = Usuario.objects.filter(
        id=responsavel_id,
        role=Usuario.Role.RESPONSAVEL,
        escola_id=user.escola_id,
    ).first()
    if responsavel is None:
        raise HttpError(404, "Responsável não encontrado nesta escola.")
    aluno = (
        Usuario.objects.filter(id=payload.aluno_id, role=Usuario.Role.ALUNO)
        .select_related("turma", "turma__escola")
        .first()
    )
    if (
        aluno is None
        or aluno.turma is None
        or aluno.turma.escola_id != user.escola_id
    ):
        raise HttpError(403, "Aluno fora da sua escola.")
    if ResponsavelAluno.objects.filter(
        responsavel=responsavel, aluno=aluno
    ).exists():
        raise HttpError(409, "Vínculo já existe.")
    try:
        ra = ResponsavelAluno(responsavel=responsavel, aluno=aluno)
        ra.full_clean()
        ra.save()
    except IntegrityError:
        raise HttpError(409, "Vínculo já existe.")
    return 201, {"detail": "Vínculo criado."}


@saas_responsaveis_router.delete(
    "/responsaveis/{responsavel_id}/desvincular-aluno/",
    response={200: MessageOut, 404: MessageOut},
)
def desvincular_aluno(request, responsavel_id: int, payload: VinculoAlunoIn):
    user = require_coordenador(request)
    responsavel = Usuario.objects.filter(
        id=responsavel_id,
        role=Usuario.Role.RESPONSAVEL,
        escola_id=user.escola_id,
    ).first()
    if responsavel is None:
        raise HttpError(404, "Responsável não encontrado nesta escola.")
    deleted, _ = ResponsavelAluno.objects.filter(
        responsavel=responsavel, aluno_id=payload.aluno_id
    ).delete()
    if not deleted:
        raise HttpError(404, "Vínculo não encontrado.")
    return {"detail": "Vínculo removido."}


@saas_responsaveis_router.get(
    "/responsaveis/{responsavel_id}/alunos/", response=List[FilhoOut]
)
def listar_alunos_de_responsavel(request, responsavel_id: int):
    user = require_coordenador(request)
    responsavel = Usuario.objects.filter(
        id=responsavel_id,
        role=Usuario.Role.RESPONSAVEL,
        escola_id=user.escola_id,
    ).first()
    if responsavel is None:
        raise HttpError(404, "Responsável não encontrado nesta escola.")
    vinculos = ResponsavelAluno.objects.filter(
        responsavel=responsavel
    ).select_related("aluno", "aluno__turma", "aluno__turma__escola")
    return [
        {
            "id": v.aluno_id,
            "nome": (
                f"{v.aluno.first_name} {v.aluno.last_name}"
            ).strip()
            or v.aluno.email,
            "turma_id": v.aluno.turma_id,
            "turma_nome": v.aluno.turma.nome if v.aluno.turma else None,
            "escola_nome": v.aluno.turma.escola.nome
            if v.aluno.turma
            else None,
        }
        for v in vinculos
    ]


# ----------------------------------------------------------------- App routes
@app_responsavel_router.get("/filhos/", response=List[FilhoOut])
def listar_filhos(request):
    user = require_responsavel(request)
    vinculos = (
        ResponsavelAluno.objects.filter(responsavel=user)
        .select_related("aluno", "aluno__turma", "aluno__turma__escola")
    )
    return [
        {
            "id": v.aluno_id,
            "nome": (
                f"{v.aluno.first_name} {v.aluno.last_name}"
            ).strip()
            or v.aluno.email,
            "turma_id": v.aluno.turma_id,
            "turma_nome": v.aluno.turma.nome if v.aluno.turma else None,
            "escola_nome": v.aluno.turma.escola.nome
            if v.aluno.turma
            else None,
        }
        for v in vinculos
    ]


@app_responsavel_router.get(
    "/filhos/{aluno_id}/boletim/",
    response={200: BoletimOut, 403: MessageOut},
)
def boletim_filho(request, aluno_id: int, disciplina: str | None = None):
    user = require_responsavel(request)
    if not ResponsavelAluno.objects.filter(
        responsavel=user, aluno_id=aluno_id
    ).exists():
        raise HttpError(403, "Acesso negado: aluno não vinculado.")
    aluno = (
        Usuario.objects.filter(id=aluno_id, role=Usuario.Role.ALUNO)
        .select_related("turma")
        .first()
    )
    if aluno is None or aluno.turma_id is None:
        raise HttpError(404, "Aluno não encontrado.")
    atividades = Atividade.objects.filter(
        turma=aluno.turma,
        status_publicacao=Atividade.StatusPublicacao.PUBLICADO,
    )
    if disciplina:
        atividades = atividades.filter(disciplina__iexact=disciplina)

    provas: List[dict] = []
    exercicios: List[dict] = []
    for atv in atividades:
        override = NotaAtividadeAluno.objects.filter(
            aluno=aluno, atividade=atv
        ).first()
        nota = override.nota_override if override else atv.calcular_nota_aluno(aluno)
        item = {
            "atividade_id": atv.id,
            "titulo": atv.titulo,
            "tipo_atividade": atv.tipo_atividade,
            "disciplina": atv.disciplina,
            "peso": atv.peso or 1,
            "nota": nota,
            "data": atv.data_liberacao or atv.criado_em,
        }
        if atv.tipo_atividade == Atividade.TipoAtividade.PROVA:
            provas.append(item)
        else:
            exercicios.append(item)
    return {
        "aluno_id": aluno.id,
        "aluno_nome": (
            f"{aluno.first_name} {aluno.last_name}"
        ).strip()
        or aluno.email,
        "media_geral_ponderada": Atividade.calcular_media_geral_aluno(
            aluno, aluno.turma
        ),
        "provas": provas,
        "exercicios": exercicios,
    }
