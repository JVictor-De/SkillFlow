"""Submission domain logic — synchronous MC, deadline / clock-drift checks."""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from django.conf import settings
from django.utils import timezone
from ninja.errors import HttpError

from apps.atividades.models import Atividade, Exercicio
from apps.submissoes.models import Submissao


def _normalize(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if timezone.is_naive(dt):
        return timezone.make_aware(dt, timezone.get_current_timezone())
    return dt


def avaliar_prazo(
    atividade: Atividade,
    *,
    timestamp_local: datetime | None,
    client_server_offset_ms: int | None,
    atividade_updated_at_snapshot: datetime | None,
) -> tuple[str | None, str | None]:
    """Validate online vs offline submission deadlines.

    Returns ``(novo_status, motivo)`` where ``novo_status`` is one of:
    - ``None`` → accept the submission for normal processing
    - ``"CONFLITO_SYNC"`` → submission is suspect / out of sync, mark as conflict
    - raises HttpError(400) when an online submission is over the deadline.
    """
    timestamp_local = _normalize(timestamp_local)
    atividade_updated_at_snapshot = _normalize(atividade_updated_at_snapshot)
    if atividade.data_limite is None:
        return None, None
    now = timezone.now()
    is_offline = (
        timestamp_local is not None
        or client_server_offset_ms is not None
    )
    if not is_offline:
        if now > atividade.data_limite:
            raise HttpError(400, "Prazo expirado.")
        return None, None

    # Offline branch — full set of metadata must be present.
    if timestamp_local is None or client_server_offset_ms is None:
        return Submissao.Status.CONFLITO_SYNC, "metadados offline incompletos"

    drift_tol = timedelta(minutes=settings.OFFLINE_CLOCK_DRIFT_TOLERANCE_MIN)
    if abs(client_server_offset_ms) > 24 * 3600 * 1000:
        return Submissao.Status.CONFLITO_SYNC, "offset acima do permitido"
    timestamp_estimado = timestamp_local + timedelta(
        milliseconds=client_server_offset_ms
    )
    if (
        atividade_updated_at_snapshot
        and atividade_updated_at_snapshot < atividade.updated_at - timedelta(seconds=1)
    ):
        return (
            Submissao.Status.CONFLITO_SYNC,
            "atividade alterada desde o cache",
        )
    if abs((timestamp_estimado - now).total_seconds()) > drift_tol.total_seconds() + 24 * 3600:
        # Too far in the future — clock manipulation suspect.
        return Submissao.Status.CONFLITO_SYNC, "relógio do cliente incoerente"
    if timestamp_estimado > atividade.data_limite + drift_tol:
        # Cleanly past the deadline.
        raise HttpError(400, "Prazo expirado (verificado pelo timestamp local).")
    return None, None


def corrigir_mc(submissao: Submissao, exercicio: Exercicio) -> bool:
    """Synchronous MC grading: 100 if correct, 0 if wrong."""
    resposta = (submissao.resposta_texto or "").strip().upper()
    gabarito = (exercicio.gabarito_esperado or "").strip().upper()
    correto = resposta == gabarito
    submissao.nota_calculada = 100 if correto else 0
    submissao.feedback_ia = (
        "Resposta correta!"
        if correto
        else f"Resposta incorreta. Gabarito esperado: {exercicio.gabarito_esperado}."
    )
    submissao.status = Submissao.Status.CORRIGIDA
    submissao.save()
    return correto
