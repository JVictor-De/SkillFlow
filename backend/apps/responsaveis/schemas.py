"""Schemas for responsaveis endpoints (SaaS + App)."""
from __future__ import annotations

from datetime import datetime
from typing import List

from ninja import Schema


class ResponsavelOut(Schema):
    id: int
    nome: str
    email: str
    qtd_filhos: int = 0


class CadastroResponsavelIn(Schema):
    nome: str
    email: str


class CadastroResponsavelOut(Schema):
    id: int
    nome: str
    email: str
    senha_provisoria: str


class VinculoAlunoIn(Schema):
    aluno_id: int


class FilhoOut(Schema):
    id: int
    nome: str
    turma_id: int | None
    turma_nome: str | None
    escola_nome: str | None


class BoletimAtividadeItem(Schema):
    atividade_id: int
    titulo: str
    tipo_atividade: str
    disciplina: str
    peso: int
    nota: int | None
    data: datetime | None


class BoletimOut(Schema):
    aluno_id: int
    aluno_nome: str
    media_geral_ponderada: int | None
    provas: List[BoletimAtividadeItem]
    exercicios: List[BoletimAtividadeItem]


class MessageOut(Schema):
    detail: str
