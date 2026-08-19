"""Business logic shared across the escolas SaaS endpoints."""
from __future__ import annotations

from typing import Iterable

from django.db.models import QuerySet
from ninja.errors import HttpError

from apps.accounts.models import Usuario
from apps.escolas.models import ProfessorTurma, Turma


def turmas_do_usuario(user: Usuario) -> QuerySet[Turma]:
    """Return the queryset of turmas a docente can act on."""
    if user.is_coordenador:
        return Turma.objects.filter(escola_id=user.escola_id)
    if user.is_professor:
        ids = ProfessorTurma.objects.filter(professor=user).values_list(
            "turma_id", flat=True
        )
        return Turma.objects.filter(id__in=list(ids))
    return Turma.objects.none()


def assert_pode_operar_turma(user: Usuario, turma: Turma) -> None:
    """Raise HttpError(403) if `user` is not entitled to operate on `turma`."""
    if user.is_coordenador:
        if turma.escola_id != user.escola_id:
            raise HttpError(403, "Acesso negado: turma fora da sua escola.")
        return
    if user.is_professor:
        if not ProfessorTurma.objects.filter(professor=user, turma=turma).exists():
            raise HttpError(
                403, "Acesso negado: você não está vinculado a esta turma."
            )
        return
    raise HttpError(403, "Acesso negado para este perfil.")


def assert_coordenador_da_escola(user: Usuario, escola_id: int) -> None:
    if not user.is_coordenador:
        raise HttpError(403, "Apenas coordenadores podem executar esta ação.")
    if user.escola_id != escola_id:
        raise HttpError(403, "Acesso negado: escola diferente.")


def get_turma_or_403(user: Usuario, turma_id: int) -> Turma:
    turma = Turma.objects.filter(id=turma_id).select_related("escola").first()
    if turma is None:
        raise HttpError(404, "Turma não encontrada.")
    assert_pode_operar_turma(user, turma)
    return turma
