"""Submissoes endpoints — SaaS (correções/override) and App (envio + chat)."""
from __future__ import annotations

import logging
from datetime import datetime
from typing import List, Optional

from django.core.files.uploadedfile import UploadedFile as DjangoUploadedFile
from django.utils import timezone
from ninja import File, Form, Router
from ninja.errors import HttpError
from ninja.files import UploadedFile

from apps.accounts.auth import (
    jwt_auth,
    require_aluno,
    require_docente,
)
from apps.accounts.pagination import paginate
from apps.atividades.models import Atividade, Exercicio
from apps.escolas.services import (
    assert_pode_operar_turma,
    turmas_do_usuario,
)
from apps.submissoes.models import ChatDuvida, Submissao
from apps.submissoes.schemas import (
    ChatIn,
    ChatMensagemOut,
    ChatOut,
    MessageOut,
    OverrideNotaIn,
    ResolverConflitoIn,
    SubmissaoIn,
    SubmissaoOnlineCreatedOut,
    SubmissaoOut,
)
from apps.submissoes.services import avaliar_prazo, corrigir_mc
from services.pdf_service import validar_upload_pdf

logger = logging.getLogger("skillflow.submissoes")
saas_submissoes_router = Router(tags=["saas-submissoes"], auth=jwt_auth)
app_submissoes_router = Router(tags=["app-submissoes"], auth=jwt_auth)


def _absolute_media_url(request, file_field) -> str | None:
    """Build an absolute URL for a FileField, when populated.

    The frontend (Next.js) e o app mobile (Flutter) consomem ``pdf_url``
    diretamente em `<a href>` ou `OpenFile`. Antes retornávamos o caminho
    relativo (`/media/submissoes/foo.pdf`); quando a API e o cliente vivem
    em origens diferentes (web em `app.skillflow...` e API em
    `api.skillflow...`), o navegador resolvia o link no domínio do
    frontend e caía em 404. Resolver com ``build_absolute_uri`` torna o
    contrato self-contained — Django respeita ``SECURE_PROXY_SSL_HEADER``
    e devolve ``https://api.skillflow.peladeiro.cloud/media/...`` em
    produção. ``None`` é preservado para permitir UI condicional ("sem
    PDF anexado").
    """
    if not file_field:
        return None
    try:
        url = file_field.url
    except ValueError:
        # Storage não tem base_url — defensive, não quebra o response.
        return None
    if request is not None:
        return request.build_absolute_uri(url)
    return url


def _submissao_to_out(s: Submissao, request=None) -> dict:
    aluno_nome = (
        f"{s.aluno.first_name} {s.aluno.last_name}"
    ).strip() or s.aluno.email
    return {
        "id": s.id,
        "aluno_id": s.aluno_id,
        "aluno_nome": aluno_nome,
        "exercicio_id": s.exercicio_id,
        "atividade_id": s.exercicio.atividade_id,
        "atividade_titulo": s.exercicio.atividade.titulo,
        "tipo_exercicio": s.exercicio.tipo,
        "tipo_atividade": s.exercicio.atividade.tipo_atividade,
        "resposta_texto": s.resposta_texto,
        "pdf_url": _absolute_media_url(request, s.pdf),
        "nota_calculada": s.nota_calculada,
        "nota_professor_override": s.nota_professor_override,
        "nota_final": s.nota_final,
        "feedback_ia": s.feedback_ia,
        "feedback_professor": s.feedback_professor,
        "feedback_final": s.feedback_final,
        "categoria_erro_analytics": s.categoria_erro_analytics,
        "status": s.status,
        "criado_em": s.criado_em,
        "updated_at": s.updated_at,
    }


# --------------------------------------------------------------- SaaS routes
@saas_submissoes_router.get("/submissoes/", response=dict)
def listar_submissoes_saas(request, turma_id: int | None = None, status: str | None = None):
    user = require_docente(request)
    qs = (
        Submissao.objects.select_related(
            "aluno",
            "exercicio",
            "exercicio__atividade",
            "exercicio__atividade__turma",
        )
        .order_by("-criado_em")
    )
    turmas_visiveis = list(
        turmas_do_usuario(user).values_list("id", flat=True)
    )
    qs = qs.filter(exercicio__atividade__turma_id__in=turmas_visiveis)
    if turma_id:
        qs = qs.filter(exercicio__atividade__turma_id=turma_id)
    if status:
        qs = qs.filter(status=status.upper())
    return paginate(request, qs, lambda s: _submissao_to_out(s, request))


@saas_submissoes_router.get(
    "/submissoes/{submissao_id}/", response=SubmissaoOut
)
def detalhe_submissao(request, submissao_id: int):
    user = require_docente(request)
    s = (
        Submissao.objects.select_related(
            "aluno",
            "exercicio",
            "exercicio__atividade",
            "exercicio__atividade__turma",
        )
        .filter(id=submissao_id)
        .first()
    )
    if s is None:
        raise HttpError(404, "Submissão não encontrada.")
    assert_pode_operar_turma(user, s.exercicio.atividade.turma)
    # Defensive trigger: dissertativas que ficaram presas em PENDENTE
    # (worker offline na hora do envio, falha transitória do LLM, etc.)
    # ressuscitam o pipeline na primeira vez que um docente abre o
    # detalhe. A task é idempotente — se já estiver CORRIGIDA, sai cedo.
    if (
        s.exercicio.tipo in Exercicio.TIPOS_DISSERTATIVOS
        and s.status == Submissao.Status.PENDENTE
        and (s.pdf or s.resposta_texto)
    ):
        from tasks.submissoes import corrigir_dissertativa

        corrigir_dissertativa.delay(s.id)
        s.refresh_from_db()
    return _submissao_to_out(s, request)


@saas_submissoes_router.put(
    "/submissoes/{submissao_id}/override-nota/",
    response={200: SubmissaoOut, 400: MessageOut, 403: MessageOut},
)
def override_nota_submissao(request, submissao_id: int, payload: OverrideNotaIn):
    user = require_docente(request)
    s = (
        Submissao.objects.select_related(
            "exercicio", "exercicio__atividade", "exercicio__atividade__turma"
        )
        .filter(id=submissao_id)
        .first()
    )
    if s is None:
        raise HttpError(404, "Submissão não encontrada.")
    assert_pode_operar_turma(user, s.exercicio.atividade.turma)
    if payload.nota is None and payload.feedback is None:
        raise HttpError(400, "Forneça nota e/ou feedback.")
    update_fields: list[str] = []
    if payload.nota is not None:
        if not (0 <= payload.nota <= 100):
            raise HttpError(400, "Nota deve estar entre 0 e 100.")
        s.nota_professor_override = payload.nota
        update_fields.append("nota_professor_override")
    if payload.feedback is not None:
        s.feedback_professor = payload.feedback
        update_fields.append("feedback_professor")
    s.override_por = user
    s.status = Submissao.Status.REVISADA_PROFESSOR
    update_fields += ["override_por", "status", "updated_at"]
    s.save(update_fields=update_fields)
    s.refresh_from_db()
    return _submissao_to_out(s, request)


@saas_submissoes_router.put(
    "/submissoes/{submissao_id}/resolver-conflito/",
    response={200: SubmissaoOut, 400: MessageOut, 403: MessageOut},
)
def resolver_conflito(request, submissao_id: int, payload: ResolverConflitoIn):
    user = require_docente(request)
    s = (
        Submissao.objects.select_related(
            "exercicio", "exercicio__atividade", "exercicio__atividade__turma"
        )
        .filter(id=submissao_id)
        .first()
    )
    if s is None:
        raise HttpError(404, "Submissão não encontrada.")
    assert_pode_operar_turma(user, s.exercicio.atividade.turma)
    if s.status != Submissao.Status.CONFLITO_SYNC:
        raise HttpError(400, "Submissão não está em conflito.")
    s.observacao_resolucao = payload.observacao
    if payload.acao == "aceitar":
        s.status = Submissao.Status.PENDENTE
        if s.exercicio.tipo == Exercicio.Tipo.MULTIPLA_ESCOLHA:
            corrigir_mc(s, s.exercicio)
        else:
            from tasks.submissoes import corrigir_dissertativa

            s.save()
            corrigir_dissertativa.delay(s.id)
    elif payload.acao == "rejeitar":
        s.nota_calculada = 0
        s.feedback_ia = "Submissão rejeitada por conflito de sincronização."
        s.status = Submissao.Status.REVISADA_PROFESSOR
        s.override_por = user
        s.save()
    else:  # solicitar_reenvio
        s.status = Submissao.Status.PENDENTE
        s.resposta_texto = None
        if s.pdf:
            s.pdf.delete(save=False)
            s.pdf = None
        s.save()
    s.refresh_from_db()
    return _submissao_to_out(s, request)


# ---------------------------------------------------------------- App routes
@app_submissoes_router.post(
    "/submissoes/",
    response={
        201: SubmissaoOnlineCreatedOut,
        400: MessageOut,
        403: MessageOut,
        409: MessageOut,
    },
)
def criar_submissao(
    request,
    exercicio_id: int = Form(...),
    resposta_texto: str | None = Form(None),
    timestamp_local: datetime | None = Form(None),
    server_time_snapshot: datetime | None = Form(None),
    client_server_offset_ms: int | None = Form(None),
    atividade_updated_at_snapshot: datetime | None = Form(None),
    pdf: UploadedFile | None = File(None),
):
    user = require_aluno(request)
    exercicio = (
        Exercicio.objects.select_related("atividade", "atividade__turma")
        .filter(id=exercicio_id)
        .first()
    )
    if exercicio is None:
        raise HttpError(404, "Exercício não encontrado.")
    if exercicio.atividade.turma_id != user.turma_id:
        raise HttpError(403, "Exercício fora da sua turma.")
    if exercicio.atividade.status_publicacao != Atividade.StatusPublicacao.PUBLICADO:
        raise HttpError(400, "Atividade ainda não publicada.")
    if Submissao.objects.filter(aluno=user, exercicio=exercicio).exists():
        raise HttpError(409, "Você já enviou uma resposta para este exercício.")

    novo_status, motivo = avaliar_prazo(
        exercicio.atividade,
        timestamp_local=timestamp_local,
        client_server_offset_ms=client_server_offset_ms,
        atividade_updated_at_snapshot=atividade_updated_at_snapshot,
    )

    if exercicio.tipo == Exercicio.Tipo.MULTIPLA_ESCOLHA and pdf is not None:
        raise HttpError(400, "Múltipla escolha não aceita PDF.")
    if exercicio.tipo == Exercicio.Tipo.DISSERTATIVA and pdf is None:
        raise HttpError(400, "Dissertativa por anexo exige PDF.")
    if exercicio.tipo == Exercicio.Tipo.DISSERTATIVA_TEXTO:
        if pdf is not None:
            raise HttpError(
                400, "Dissertativa por texto não aceita anexo PDF."
            )
        if not (resposta_texto or "").strip():
            raise HttpError(
                400, "Dissertativa por texto exige resposta escrita."
            )

    if pdf is not None:
        validar_upload_pdf(
            pdf, max_bytes=10 * 1024 * 1024, rotulo="Submissão"
        )

    submissao = Submissao.objects.create(
        aluno=user,
        exercicio=exercicio,
        resposta_texto=resposta_texto,
        pdf=pdf,
        timestamp_local=timestamp_local,
        server_time_snapshot=server_time_snapshot,
        client_server_offset_ms=client_server_offset_ms,
        atividade_updated_at_snapshot=atividade_updated_at_snapshot,
        status=Submissao.Status.PENDENTE,
    )
    if novo_status == Submissao.Status.CONFLITO_SYNC:
        submissao.status = Submissao.Status.CONFLITO_SYNC
        submissao.observacao_resolucao = motivo
        submissao.save(update_fields=["status", "observacao_resolucao", "updated_at"])
        return 201, {
            "submissao_id": submissao.id,
            "status": submissao.status,
            "nota_calculada": None,
            "feedback_ia": None,
            "correto": None,
        }

    if exercicio.tipo == Exercicio.Tipo.MULTIPLA_ESCOLHA:
        correto = corrigir_mc(submissao, exercicio)
        return 201, {
            "submissao_id": submissao.id,
            "status": submissao.status,
            "nota_calculada": submissao.nota_calculada,
            "feedback_ia": submissao.feedback_ia,
            "correto": correto,
        }

    # Dissertativa (texto e anexo) — async path. Mesmo pipeline para ambos:
    # o worker decide se extrai texto do PDF ou usa `resposta_texto`.
    from tasks.submissoes import corrigir_dissertativa

    corrigir_dissertativa.delay(submissao.id)
    return 201, {
        "submissao_id": submissao.id,
        "status": submissao.status,
        "nota_calculada": None,
        "feedback_ia": None,
        "correto": None,
    }


@app_submissoes_router.get("/submissoes/", response=List[SubmissaoOut])
def listar_submissoes_app(request, atividade_id: int | None = None):
    user = require_aluno(request)
    qs = (
        Submissao.objects.filter(aluno=user)
        .select_related(
            "aluno", "exercicio", "exercicio__atividade", "exercicio__atividade__turma"
        )
        .order_by("-criado_em")
    )
    if atividade_id:
        qs = qs.filter(exercicio__atividade_id=atividade_id)
    return [_submissao_to_out(s, request) for s in qs]


@app_submissoes_router.get(
    "/submissoes/{submissao_id}/resultado/", response=SubmissaoOut
)
def resultado(request, submissao_id: int):
    user = require_aluno(request)
    s = (
        Submissao.objects.filter(id=submissao_id, aluno=user)
        .select_related("aluno", "exercicio", "exercicio__atividade")
        .first()
    )
    if s is None:
        raise HttpError(404, "Submissão não encontrada.")
    return _submissao_to_out(s, request)


@app_submissoes_router.post(
    "/submissoes/{submissao_id}/chat/",
    response={200: ChatOut, 400: MessageOut, 403: MessageOut},
)
def chat_tutor(request, submissao_id: int, payload: ChatIn):
    user = require_aluno(request)
    s = (
        Submissao.objects.filter(id=submissao_id, aluno=user)
        .select_related("exercicio", "exercicio__atividade")
        .first()
    )
    if s is None:
        raise HttpError(404, "Submissão não encontrada.")
    if s.status not in {
        Submissao.Status.CORRIGIDA,
        Submissao.Status.REVISADA_PROFESSOR,
    }:
        raise HttpError(400, "Aguarde a correção para usar o chat.")
    chat, _ = ChatDuvida.objects.get_or_create(submissao=s)
    if chat.contador_mensagens_aluno >= ChatDuvida.LIMITE_MENSAGENS:
        raise HttpError(403, "Limite de mensagens atingido.")
    mensagens = list(chat.mensagens or [])
    mensagens.append({"role": "aluno", "content": payload.mensagem})
    from services.llm_service import get_llm_service

    llm = get_llm_service()
    resposta_ia = llm.chat_tutor(
        contexto={
            "enunciado": s.exercicio.enunciado,
            "gabarito": s.exercicio.gabarito_esperado,
            "resposta_aluno": s.resposta_texto or "(arquivo PDF anexado)",
            "feedback_anterior": s.feedback_final or "",
        },
        mensagens=mensagens,
    )
    mensagens.append({"role": "ia", "content": resposta_ia})
    chat.mensagens = mensagens
    chat.contador_mensagens_aluno += 1
    chat.save()
    return {
        "mensagens": [
            {"role": m["role"], "content": m["content"]} for m in mensagens
        ],
        "contador_mensagens_aluno": chat.contador_mensagens_aluno,
        "limite": ChatDuvida.LIMITE_MENSAGENS,
    }
