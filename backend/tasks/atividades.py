"""Celery tasks for activities — RAG generation and Drip Content."""
from __future__ import annotations

import logging

from celery import shared_task
from django.utils import timezone

from apps.atividades.models import Atividade, Exercicio, MaterialApoio
from services.llm_service import get_llm_service
from services.pdf_service import extrair_texto_pdf

logger = logging.getLogger("skillflow.tasks.atividades")


@shared_task(name="tasks.atividades.gerar_exercicios_ia")
def gerar_exercicios_ia(atividade_id: int, material_id: int, quantidade: int) -> int:
    atividade = Atividade.objects.filter(id=atividade_id).first()
    material = MaterialApoio.objects.filter(id=material_id).first()
    if atividade is None or material is None:
        logger.warning("gerar_exercicios_ia: atividade/material ausente.")
        return 0

    texto = extrair_texto_pdf(material.arquivo.path)
    llm = get_llm_service()
    questoes = llm.gerar_exercicios(texto, max(1, int(quantidade)))

    exercicios_atuais = atividade.exercicios.count()
    bulk = []
    tipos_validos = {
        Exercicio.Tipo.MULTIPLA_ESCOLHA,
        Exercicio.Tipo.DISSERTATIVA,
        Exercicio.Tipo.DISSERTATIVA_TEXTO,
    }
    for idx, q in enumerate(questoes, start=exercicios_atuais + 1):
        tipo = q.get("tipo")
        if tipo not in tipos_validos:
            continue
        alternativas = q.get("alternativas")
        if tipo == Exercicio.Tipo.MULTIPLA_ESCOLHA and not alternativas:
            continue
        if tipo in Exercicio.TIPOS_DISSERTATIVOS:
            alternativas = None
        bulk.append(
            Exercicio(
                atividade=atividade,
                ordem=idx,
                tipo=tipo,
                enunciado=q.get("enunciado", "")[:5000],
                gabarito_esperado=q.get("gabarito", "")[:5000],
                alternativas=alternativas,
            )
        )
    if bulk:
        Exercicio.objects.bulk_create(bulk)
    return len(bulk)


@shared_task(name="tasks.atividades.atualizar_atividades_agendadas")
def atualizar_atividades_agendadas() -> int:
    """Drip-content publisher — promote AGENDADO → PUBLICADO."""
    qs = Atividade.objects.filter(
        status_publicacao=Atividade.StatusPublicacao.AGENDADO,
        data_liberacao__lte=timezone.now(),
    )
    return qs.update(status_publicacao=Atividade.StatusPublicacao.PUBLICADO)
