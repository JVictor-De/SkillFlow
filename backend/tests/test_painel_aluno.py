"""Painel do aluno (dashboard) tests."""
from __future__ import annotations

import pytest

from apps.atividades.models import Atividade
from apps.submissoes.models import Submissao


@pytest.mark.django_db
def test_painel_retorna_media_geral_ponderada_e_progresso_disciplina(
    client, cenario, auth_headers, make_atividade
):
    ex_atv = make_atividade(
        turma=cenario["turma"], criado_por=cenario["professor"],
        tipo=Atividade.TipoAtividade.EXERCICIO, disciplina="Matemática",
    )
    prova = make_atividade(
        turma=cenario["turma"], criado_por=cenario["professor"],
        tipo=Atividade.TipoAtividade.PROVA, peso=3, disciplina="Português",
    )
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=ex_atv.exercicios.get(ordem=1),
        resposta_texto="C", nota_calculada=80, status=Submissao.Status.CORRIGIDA,
    )
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=ex_atv.exercicios.get(ordem=2),
        resposta_texto="x", nota_calculada=80, status=Submissao.Status.CORRIGIDA,
    )
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=prova.exercicios.get(ordem=1),
        resposta_texto="C", nota_calculada=60, status=Submissao.Status.CORRIGIDA,
    )
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=prova.exercicios.get(ordem=2),
        resposta_texto="y", nota_calculada=60, status=Submissao.Status.CORRIGIDA,
    )
    resp = client.get("/api/app/painel/", **auth_headers(cenario["aluno"]))
    assert resp.status_code == 200
    body = resp.json()
    # Exercício peso 1, prova peso 3 → (80*1 + 60*3) / 4 = 65
    assert body["media_geral_ponderada"] == 65
    discs = {d["disciplina"]: d["media"] for d in body["progresso_por_disciplina"]}
    assert discs["Matemática"] == 80
    assert discs["Português"] == 60
    # Aliases consumed by the mobile app should mirror the legacy keys
    # so the Flutter parser doesn't crash with a null cast.
    assert body["media_geral"] == 65
    assert body["progresso_disciplinas"] == body["progresso_por_disciplina"]
    assert body["historico"] == body["historico_notas"]
    # Histórico carrega disciplina + tipo (campos novos consumidos pela
    # tela de Histórico recente do app).
    assert all("disciplina" in h and "tipo" in h for h in body["historico"])


@pytest.mark.django_db
def test_painel_aluno_sem_submissoes_nao_quebra_contrato(
    client, cenario, auth_headers
):
    """Regression: aluno novato sem nenhuma submissão deve receber um
    payload válido (com `media_geral=0`) em vez de fazer o app cair em
    "Não foi possível carregar o painel" por TypeError no parser."""
    resp = client.get("/api/app/painel/", **auth_headers(cenario["aluno"]))
    assert resp.status_code == 200
    body = resp.json()
    assert body["media_geral"] == 0
    assert body["progresso_disciplinas"] == []
    assert body["historico"] == []
    assert body["atividades_pendentes"] >= 0
