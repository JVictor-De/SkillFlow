"""Schemas for submissoes endpoints (SaaS + App)."""
from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from ninja import Schema


class SubmissaoOut(Schema):
    id: int
    aluno_id: int
    aluno_nome: str
    exercicio_id: int
    atividade_id: int
    atividade_titulo: str
    tipo_exercicio: str
    tipo_atividade: str
    resposta_texto: str | None
    pdf_url: str | None
    nota_calculada: int | None
    nota_professor_override: int | None
    nota_final: int | None
    feedback_ia: str | None
    feedback_professor: str | None
    feedback_final: str | None
    categoria_erro_analytics: str | None
    status: str
    criado_em: datetime
    updated_at: datetime


class SubmissaoIn(Schema):
    """Body of POST /api/app/submissoes/ (JSON branch)."""

    exercicio_id: int
    resposta_texto: str | None = None
    timestamp_local: datetime | None = None
    server_time_snapshot: datetime | None = None
    client_server_offset_ms: int | None = None
    atividade_updated_at_snapshot: datetime | None = None


class SubmissaoOnlineCreatedOut(Schema):
    submissao_id: int
    status: str
    nota_calculada: int | None = None
    feedback_ia: str | None = None
    correto: bool | None = None


class OverrideNotaIn(Schema):
    nota: int | None = None
    feedback: str | None = None


class ResolverConflitoIn(Schema):
    acao: Literal["aceitar", "rejeitar", "solicitar_reenvio"]
    observacao: str | None = None


class ChatIn(Schema):
    mensagem: str


class ChatMensagemOut(Schema):
    role: Literal["aluno", "ia"]
    content: str


class ChatOut(Schema):
    mensagens: List[ChatMensagemOut]
    contador_mensagens_aluno: int
    limite: int = 3


class MessageOut(Schema):
    detail: str
