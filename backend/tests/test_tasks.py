"""Celery tasks — corrigir_dissertativa, gerar_exercicios_ia, drip content."""
from __future__ import annotations

from datetime import timedelta

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from apps.atividades.models import Atividade, Exercicio, MaterialApoio
from apps.submissoes.models import Submissao


@pytest.mark.django_db
def test_corrigir_dissertativa_atualiza_nota_e_feedback(
    cenario, make_atividade
):
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    ex = atv.exercicios.get(ordem=2)
    sub = Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=ex, resposta_texto="A ordem dos somandos não altera a soma comutativa.",
        status=Submissao.Status.PENDENTE,
    )
    from tasks.submissoes import corrigir_dissertativa

    corrigir_dissertativa(sub.id)
    sub.refresh_from_db()
    assert sub.status == Submissao.Status.CORRIGIDA
    assert sub.nota_calculada is not None
    assert sub.feedback_ia


@pytest.mark.django_db
def test_gerar_exercicios_ia_cria_exercicios_no_banco(cenario, make_atividade):
    atv = Atividade.objects.create(
        titulo="IA empty",
        disciplina="Mat",
        tipo_atividade=Atividade.TipoAtividade.EXERCICIO,
        peso=1,
        status_publicacao=Atividade.StatusPublicacao.DRAFT,
        turma=cenario["turma"],
        criado_por=cenario["professor"],
    )
    material = MaterialApoio.objects.create(
        titulo="Apostila",
        arquivo=SimpleUploadedFile("a.pdf", b"%PDF-1.4\n%%EOF"),
        turma=cenario["turma"],
        enviado_por=cenario["professor"],
    )
    from tasks.atividades import gerar_exercicios_ia

    n = gerar_exercicios_ia(atv.id, material.id, 4)
    assert n >= 1
    atv.refresh_from_db()
    assert atv.exercicios.count() >= 1


@pytest.mark.django_db
def test_drip_content_promove_agendado_para_publicado(cenario, make_atividade):
    agora = timezone.now()
    atv = make_atividade(
        turma=cenario["turma"], criado_por=cenario["professor"],
        status=Atividade.StatusPublicacao.AGENDADO,
        data_liberacao=agora - timedelta(minutes=1),
        data_limite=agora + timedelta(days=1),
    )
    from tasks.atividades import atualizar_atividades_agendadas

    n = atualizar_atividades_agendadas()
    assert n >= 1
    atv.refresh_from_db()
    assert atv.status_publicacao == Atividade.StatusPublicacao.PUBLICADO
