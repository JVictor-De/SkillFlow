"""Ranking tests — pontuação, provas, ativação por turma."""
from __future__ import annotations

import json

import pytest

from apps.atividades.models import Atividade
from apps.submissoes.models import Submissao


@pytest.mark.django_db
def test_ranking_desativado_retorna_ativo_false(
    client, cenario, auth_headers
):
    cenario["turma"].ranking_pontuacao_ativo = False
    cenario["turma"].save(update_fields=["ranking_pontuacao_ativo"])
    resp = client.get(
        "/api/app/turma/ranking/?tipo=pontuacao",
        **auth_headers(cenario["aluno"]),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["ativo"] is False


@pytest.mark.django_db
def test_ativar_ranking_pontuacao_e_ranking_provas(
    client, cenario, auth_headers
):
    resp = client.put(
        f"/api/saas/turmas/{cenario['turma'].id}/ranking/",
        data=json.dumps(
            {"ranking_pontuacao_ativo": True, "ranking_provas_ativo": True}
        ),
        content_type="application/json",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 200
    cenario["turma"].refresh_from_db()
    assert cenario["turma"].ranking_pontuacao_ativo is True
    assert cenario["turma"].ranking_provas_ativo is True


@pytest.mark.django_db
def test_ranking_pontuacao_retorna_soma_e_ordenado_descendente(
    client, cenario, auth_headers, make_atividade, make_user
):
    cenario["turma"].ranking_pontuacao_ativo = True
    cenario["turma"].save(update_fields=["ranking_pontuacao_ativo"])
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    aluno_b = make_user(role="ALUNO", turma=cenario["turma"])
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=atv.exercicios.get(ordem=1),
        resposta_texto="C", nota_calculada=100, status=Submissao.Status.CORRIGIDA,
    )
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=atv.exercicios.get(ordem=2),
        resposta_texto="...", nota_calculada=80, status=Submissao.Status.CORRIGIDA,
    )
    Submissao.objects.create(
        aluno=aluno_b, exercicio=atv.exercicios.get(ordem=1),
        resposta_texto="A", nota_calculada=0, status=Submissao.Status.CORRIGIDA,
    )
    resp = client.get(
        "/api/app/turma/ranking/?tipo=pontuacao",
        **auth_headers(cenario["aluno"]),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["ativo"] is True
    pos = body["ranking"]
    assert pos[0]["aluno_id"] == cenario["aluno"].id
    assert pos[0]["posicao"] == 1
    # Backend serves both keys (legacy + mobile/Next contract).
    assert body["itens"] == body["ranking"]
    assert pos[0]["aluno_nome"]


@pytest.mark.django_db
def test_ranking_inclui_todos_alunos_da_turma_mesmo_sem_nota(
    client, cenario, auth_headers, make_atividade, make_user
):
    """Regression: ranking não pode esconder alunos sem submissões.

    Antes, o app só renderizava participantes com pontuação registrada
    (efeito colateral do contrato divergente — `ranking` vs `itens`).
    Agora todo aluno da turma aparece, com `pontuacao=0` quando não há
    submissão corrigida.
    """
    cenario["turma"].ranking_pontuacao_ativo = True
    cenario["turma"].save(update_fields=["ranking_pontuacao_ativo"])
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    aluno_b = make_user(role="ALUNO", turma=cenario["turma"], nome="Bia Bento")
    aluno_c = make_user(role="ALUNO", turma=cenario["turma"], nome="Caio Couto")
    # Apenas o aluno principal tem submissão corrigida.
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=atv.exercicios.get(ordem=1),
        resposta_texto="C", nota_calculada=100,
        status=Submissao.Status.CORRIGIDA,
    )
    resp = client.get(
        "/api/app/turma/ranking/?tipo=pontuacao",
        **auth_headers(cenario["aluno"]),
    )
    assert resp.status_code == 200
    body = resp.json()
    itens = body["itens"]
    ids = [i["aluno_id"] for i in itens]
    assert cenario["aluno"].id in ids
    assert aluno_b.id in ids
    assert aluno_c.id in ids
    # Alunos sem nota têm pontuação 0 e aparecem no final.
    sem_nota = [i for i in itens if i["aluno_id"] != cenario["aluno"].id]
    assert all(i["pontuacao"] == 0 for i in sem_nota)
    # Cada item carrega `aluno_nome` (contrato consumido pelo mobile e
    # pelo frontend Next.js).
    assert all(i["aluno_nome"] for i in itens)


@pytest.mark.django_db
def test_ranking_provas_calcula_media_ponderada(
    client, cenario, auth_headers, make_atividade
):
    cenario["turma"].ranking_provas_ativo = True
    cenario["turma"].save(update_fields=["ranking_provas_ativo"])
    prova = make_atividade(
        turma=cenario["turma"], criado_por=cenario["professor"],
        tipo=Atividade.TipoAtividade.PROVA, peso=3, com_exercicios=True,
    )
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=prova.exercicios.get(ordem=1),
        resposta_texto="C", nota_calculada=90, status=Submissao.Status.CORRIGIDA,
    )
    resp = client.get(
        "/api/app/turma/ranking/?tipo=provas",
        **auth_headers(cenario["aluno"]),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["ativo"] is True


@pytest.mark.django_db
def test_ranking_saas_professor_ve_mesmo_com_toggle_desativado(
    client, cenario, auth_headers, make_atividade, make_user
):
    """Bug 1 do briefing: na aba "Ranking" da turma o professor não via
    nenhum dado quando o toggle estava desativado para os alunos. O
    endpoint SaaS aplica `force=True` para não mascarar a visão do
    docente, mesmo com `ranking_pontuacao_ativo = False`."""
    cenario["turma"].ranking_pontuacao_ativo = False
    cenario["turma"].ranking_provas_ativo = False
    cenario["turma"].save(
        update_fields=["ranking_pontuacao_ativo", "ranking_provas_ativo"]
    )
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    aluno_b = make_user(role="ALUNO", turma=cenario["turma"], nome="Beto Bento")
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=atv.exercicios.get(ordem=1),
        resposta_texto="C", nota_calculada=100, status=Submissao.Status.CORRIGIDA,
    )
    resp = client.get(
        f"/api/saas/turmas/{cenario['turma'].id}/ranking/",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 200, resp.content
    body = resp.json()
    assert body["ativo"] is True
    ids = [item["aluno_id"] for item in body["itens"]]
    assert cenario["aluno"].id in ids
    # Aluno B aparece com pontuação 0 (regressão do bug onde o ranking
    # escondia alunos sem submissão).
    pontos_b = next(
        item["pontuacao"] for item in body["itens"] if item["aluno_id"] == aluno_b.id
    )
    assert pontos_b == 0
