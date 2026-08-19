"""Schemas used by SaaS atividades endpoints and the App listing routes."""
from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from ninja import Schema


class ExercicioIn(Schema):
    ordem: int
    # Three types are accepted: multiple choice, free-text dissertativa
    # (typed on the platform) and PDF-attachment dissertativa.
    tipo: Literal[
        "MULTIPLA_ESCOLHA", "DISSERTATIVA_TEXTO", "DISSERTATIVA"
    ]
    enunciado: str
    gabarito_esperado: str
    alternativas: dict | None = None


class ExercicioOut(Schema):
    id: int
    ordem: int
    tipo: str
    enunciado: str
    alternativas: dict | None
    gabarito_esperado: str | None = None  # exposed only for SaaS responses


class ExercicioPublicOut(Schema):
    id: int
    ordem: int
    tipo: str
    enunciado: str
    alternativas: dict | None


class AtividadeIn(Schema):
    titulo: str
    disciplina: str
    tipo_atividade: Literal["EXERCICIO", "PROVA"]
    peso: int | None = None
    turma_id: int
    status_publicacao: Literal["DRAFT", "AGENDADO", "PUBLICADO"] = "DRAFT"
    data_liberacao: datetime | None = None
    data_limite: datetime | None = None
    exercicios: List[ExercicioIn] = []


class AtividadeUpdateIn(Schema):
    titulo: str | None = None
    disciplina: str | None = None
    peso: int | None = None
    data_liberacao: datetime | None = None
    data_limite: datetime | None = None
    exercicios: List[ExercicioIn] | None = None


class AtividadeOut(Schema):
    id: int
    titulo: str
    disciplina: str
    tipo_atividade: str
    peso: int | None
    status_publicacao: str
    data_liberacao: datetime | None
    data_limite: datetime | None
    turma_id: int
    criado_em: datetime
    updated_at: datetime
    qtd_exercicios: int


class AtividadeDetailOut(AtividadeOut):
    exercicios: List[ExercicioOut] = []


class AprovarAgendarIn(Schema):
    status_publicacao: Literal["AGENDADO", "PUBLICADO"]
    data_liberacao: datetime
    data_limite: datetime


class GerarIAIn(Schema):
    turma_id: int
    material_id: int
    quantidade: int = 5
    titulo: str
    disciplina: str
    tipo_atividade: Literal["EXERCICIO", "PROVA"] = "EXERCICIO"
    peso: int | None = None


class GerarIAOut(Schema):
    atividade_id: int
    status: str = "PROCESSANDO"


class MaterialApoioOut(Schema):
    id: int
    titulo: str
    arquivo_url: str
    turma_id: int
    enviado_por_id: int
    criado_em: datetime


class OverrideNotaAtividadeIn(Schema):
    aluno_id: int
    nota: int


class MessageOut(Schema):
    detail: str


class PainelDisciplinaItem(Schema):
    disciplina: str
    media: int


class PainelHistoricoItem(Schema):
    atividade_id: int
    titulo: str
    nota: int
    data: datetime
    # Disciplina + tipo are required by the mobile painel cards. Optional
    # here because legacy SaaS readers may ignore them.
    disciplina: str | None = None
    tipo: str | None = None


class PainelOut(Schema):
    """Painel response schema.

    The SaaS web reads `media_geral_ponderada` / `progresso_por_disciplina`
    / `historico_notas`. The mobile app reads `media_geral`,
    `progresso_disciplinas`, `historico`. Both shapes coexist so the
    backend can serve either client without breaking changes.
    """

    media_geral_ponderada: int | None
    progresso_por_disciplina: List[PainelDisciplinaItem]
    historico_notas: List[PainelHistoricoItem]
    media_geral: int = 0
    progresso_disciplinas: List[PainelDisciplinaItem] = []
    historico: List[PainelHistoricoItem] = []
    atividades_pendentes: int
    atividades_concluidas: int
    atividades_em_andamento: int
