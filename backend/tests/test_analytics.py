"""Analytics endpoint tests."""
from __future__ import annotations

import pytest

from apps.submissoes.models import Submissao


@pytest.mark.django_db
def test_analytics_retorna_distribuicao_erros_e_alunos_risco(
    client, cenario, auth_headers, make_atividade
):
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    ex = atv.exercicios.get(ordem=1)
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=ex, resposta_texto="A",
        nota_calculada=0, categoria_erro_analytics="Interpretação de Texto",
        status=Submissao.Status.CORRIGIDA,
    )
    resp = client.get(
        f"/api/saas/turmas/{cenario['turma'].id}/analytics/",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert any(
        d["classificacao_erro"] == "Interpretação de Texto"
        for d in body["distribuicao_erros"]
    )
    assert "alunos_risco" in body


@pytest.mark.django_db
def test_analytics_professor_so_ve_suas_turmas(client, cenario, auth_headers):
    resp = client.get(
        f"/api/saas/turmas/{cenario['turma_outra'].id}/analytics/",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 403
