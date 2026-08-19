"""Push-notification dispatcher (FCM stub).

In production this module would talk to Firebase Cloud Messaging. For
SkillFlow MVP we only log the dispatch — the worker calls this when the
last dissertativa of an Atividade gets corrected.
"""
from __future__ import annotations

import logging

logger = logging.getLogger("skillflow.services.notifications")


def notify_atividade_corrigida(aluno, atividade) -> None:
    """Log (or — in prod — send) a push notification for a corrected activity."""
    if aluno is None or atividade is None:
        return
    if not getattr(aluno, "fcm_device_token", None):
        logger.info(
            "Aluno %s sem fcm_device_token; ignorando push.", aluno.email
        )
        return
    logger.info(
        "[FCM] Aluno=%s atividade=%s 'Sua correção da atividade %s acabou de chegar!'",
        aluno.email,
        atividade.id,
        atividade.titulo,
    )
