"""Chat tutor tests — limites, status pré-correção."""
from __future__ import annotations

import json

import pytest

from apps.submissoes.models import ChatDuvida, Submissao


@pytest.mark.django_db
def test_chat_sem_submissao_corrigida_retorna_400(
    client, cenario, auth_headers, make_atividade
):
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    ex = atv.exercicios.get(ordem=1)
    sub = Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=ex, resposta_texto="C",
        status=Submissao.Status.PENDENTE,
    )
    resp = client.post(
        f"/api/app/submissoes/{sub.id}/chat/",
        data=json.dumps({"mensagem": "Por que errei?"}),
        content_type="application/json",
        **auth_headers(cenario["aluno"]),
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_enviar_mensagem_chat_sucesso_e_incrementa_contador(
    client, cenario, auth_headers, make_atividade
):
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    ex = atv.exercicios.get(ordem=1)
    sub = Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=ex, resposta_texto="A",
        nota_calculada=0, status=Submissao.Status.CORRIGIDA,
    )
    resp = client.post(
        f"/api/app/submissoes/{sub.id}/chat/",
        data=json.dumps({"mensagem": "Por que está errado?"}),
        content_type="application/json",
        **auth_headers(cenario["aluno"]),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["contador_mensagens_aluno"] == 1
    assert len(body["mensagens"]) == 2  # aluno + ia


@pytest.mark.django_db
def test_quarta_mensagem_retorna_403(
    client, cenario, auth_headers, make_atividade
):
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    ex = atv.exercicios.get(ordem=1)
    sub = Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=ex, resposta_texto="A",
        nota_calculada=0, status=Submissao.Status.CORRIGIDA,
    )
    ChatDuvida.objects.create(
        submissao=sub,
        mensagens=[],
        contador_mensagens_aluno=3,
    )
    resp = client.post(
        f"/api/app/submissoes/{sub.id}/chat/",
        data=json.dumps({"mensagem": "limite?"}),
        content_type="application/json",
        **auth_headers(cenario["aluno"]),
    )
    assert resp.status_code == 403
