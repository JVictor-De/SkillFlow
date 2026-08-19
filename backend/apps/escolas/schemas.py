"""Pydantic schemas for escolas / SaaS gestão endpoints."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from ninja import Schema


class TurmaOut(Schema):
    id: int
    nome: str
    escola_id: int
    escola_nome: str
    ranking_pontuacao_ativo: bool
    ranking_provas_ativo: bool
    qtd_alunos: int
    qtd_atividades: int


class CadastroTurmaIn(Schema):
    nome: str


class AlunoOut(Schema):
    id: int
    nome: str
    email: str
    turma_id: int | None
    turma_nome: str | None
    escola_id: int | None
    senha_provisoria: bool
    media_geral_ponderada: int | None = None


class CadastroAlunoIn(Schema):
    nome: str
    email: str


class CadastroAlunoOut(Schema):
    id: int
    nome: str
    email: str
    senha_provisoria: str


class TransferirAlunoIn(Schema):
    nova_turma_id: int


class CadastroProfessorIn(Schema):
    nome: str
    email: str


class CadastroProfessorOut(Schema):
    id: int
    nome: str
    email: str
    senha_provisoria: str


class VinculoTurmaIn(Schema):
    turma_id: int


class TurmaProfessorOut(Schema):
    id: int
    nome: str
    escola_id: int


class ProfessorTurmaResumo(Schema):
    id: int
    nome: str


class ProfessorOut(Schema):
    id: int
    nome: str
    email: str
    qtd_turmas: int
    turmas: list[ProfessorTurmaResumo]
    senha_provisoria: bool


class HistoricoAlunoItem(Schema):
    submissao_id: int
    atividade_id: int
    atividade_titulo: str
    tipo_atividade: str
    turma_id: int
    turma_nome: str
    nota: int | None
    status: str
    criado_em: datetime


class RankingAtivoIn(Schema):
    ranking_pontuacao_ativo: bool | None = None
    ranking_provas_ativo: bool | None = None


class RankingItem(Schema):
    posicao: int
    aluno_id: int
    nome: str
    aluno_nome: str | None = None
    pontuacao: float


class RankingOut(Schema):
    ativo: bool
    tipo: str | None = None
    mensagem: str | None = None
    ranking: list[RankingItem] = []
    # Mirror of `ranking` exposed under the key the mobile app + Next.js
    # types consume. Keeping both allows clients to migrate independently.
    itens: list[RankingItem] = []


class CadastroMassaOut(Schema):
    relatorio_id: int
    status: str


class RelatorioCadastroOut(Schema):
    id: int
    turma_id: int
    status: str
    resultado: dict | None
    criado_em: datetime


class MessageOut(Schema):
    detail: str
