"""Celery tasks for submission grading."""
from __future__ import annotations

import logging

from celery import shared_task
from django.utils import timezone

from apps.atividades.models import Atividade, Exercicio
from apps.submissoes.models import Submissao
from services.llm_service import get_llm_service
from services.notification_service import notify_atividade_corrigida
from services.pdf_service import extrair_texto_pdf

logger = logging.getLogger("skillflow.tasks.submissoes")


@shared_task(name="tasks.submissoes.corrigir_dissertativa")
def corrigir_dissertativa(submissao_id: int) -> int:
    """Async grading pipeline for dissertativa submissions.

    Returns the resulting nota or ``-1`` if the submission could not be
    processed (caller should not depend on the value, this is just for tests).
    """
    submissao = (
        Submissao.objects.select_related("exercicio", "exercicio__atividade")
        .filter(id=submissao_id)
        .first()
    )
    if submissao is None:
        logger.warning("corrigir_dissertativa: submissao %s não encontrada", submissao_id)
        return -1
    if submissao.exercicio.tipo not in Exercicio.TIPOS_DISSERTATIVOS:
        return -1
    submissao.status = Submissao.Status.EM_PROCESSAMENTO
    submissao.save(update_fields=["status", "updated_at"])

    texto = ""
    # Para `DISSERTATIVA_TEXTO` priorizamos o texto digitado; para
    # `DISSERTATIVA` (anexo PDF) extraímos do PDF e caímos para o texto
    # caso a extração falhe (corrige cenário de PDF ilegível).
    if submissao.exercicio.tipo == Exercicio.Tipo.DISSERTATIVA_TEXTO:
        texto = submissao.resposta_texto or ""
    else:
        if submissao.pdf:
            texto = extrair_texto_pdf(submissao.pdf.path)
        if not texto:
            texto = submissao.resposta_texto or ""

    llm = get_llm_service()
    resultado = llm.corrigir(submissao.exercicio.gabarito_esperado, texto)
    nota = int(resultado.get("nota_ia", 0))
    nota = max(0, min(100, nota))
    submissao.nota_calculada = nota
    submissao.feedback_ia = resultado.get("feedback") or ""
    submissao.categoria_erro_analytics = resultado.get("classificacao_erro") or None
    submissao.status = Submissao.Status.CORRIGIDA
    submissao.save(
        update_fields=[
            "nota_calculada",
            "feedback_ia",
            "categoria_erro_analytics",
            "status",
            "updated_at",
        ]
    )

    _maybe_notify_aluno(submissao)
    return nota


def _maybe_notify_aluno(submissao: Submissao) -> None:
    """If this was the last pending dissertativa of the activity, ping the user."""
    atividade: Atividade = submissao.exercicio.atividade
    pendentes = Submissao.objects.filter(
        aluno=submissao.aluno,
        exercicio__atividade=atividade,
        exercicio__tipo__in=Exercicio.TIPOS_DISSERTATIVOS,
        status__in=[Submissao.Status.PENDENTE, Submissao.Status.EM_PROCESSAMENTO],
    ).count()
    total_dissertativas = atividade.exercicios.filter(
        tipo__in=Exercicio.TIPOS_DISSERTATIVOS
    ).count()
    if total_dissertativas and pendentes == 0:
        notify_atividade_corrigida(submissao.aluno, atividade)
