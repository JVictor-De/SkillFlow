"""Responsáveis (parents) tests — gestão (Coordenador) + boletim (App)."""
from __future__ import annotations

import json

import pytest

from apps.accounts.models import Usuario
from apps.responsaveis.models import ResponsavelAluno
from apps.submissoes.models import Submissao


@pytest.mark.django_db
def test_coordenador_cadastra_responsavel_com_senha_provisoria(
    client, cenario, auth_headers
):
    resp = client.post(
        "/api/saas/responsaveis/cadastrar/",
        data=json.dumps({"nome": "R Pai", "email": "rpai@test.com"}),
        content_type="application/json",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 201
    user = Usuario.objects.get(email="rpai@test.com")
    assert user.role == Usuario.Role.RESPONSAVEL
    assert user.escola_id == cenario["escola"].id


@pytest.mark.django_db
def test_professor_nao_pode_cadastrar_responsavel(client, cenario, auth_headers):
    resp = client.post(
        "/api/saas/responsaveis/cadastrar/",
        data=json.dumps({"nome": "X", "email": "x@test.com"}),
        content_type="application/json",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_vincular_responsavel_a_aluno_outra_escola_retorna_403(
    client, cenario, auth_headers
):
    # Try to bind a responsavel of escola1 to an aluno of escola2.
    resp = client.post(
        f"/api/saas/responsaveis/{cenario['responsavel'].id}/vincular-aluno/",
        data=json.dumps({"aluno_id": cenario["aluno_outra"].id}),
        content_type="application/json",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_vincular_responsavel_duplicado_retorna_409(
    client, cenario, auth_headers
):
    resp = client.post(
        f"/api/saas/responsaveis/{cenario['responsavel'].id}/vincular-aluno/",
        data=json.dumps({"aluno_id": cenario["aluno"].id}),
        content_type="application/json",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 409


@pytest.mark.django_db
def test_responsavel_ve_apenas_filhos_vinculados(client, cenario, auth_headers):
    resp = client.get(
        "/api/app/responsavel/filhos/",
        **auth_headers(cenario["responsavel"]),
    )
    assert resp.status_code == 200
    body = resp.json()
    ids = [item["id"] for item in body]
    assert cenario["aluno"].id in ids
    assert cenario["aluno_outra"].id not in ids


@pytest.mark.django_db
def test_responsavel_acessa_boletim_filho_vinculado(
    client, cenario, auth_headers, make_atividade
):
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=atv.exercicios.get(ordem=1),
        resposta_texto="C", nota_calculada=100, status=Submissao.Status.CORRIGIDA,
    )
    resp = client.get(
        f"/api/app/responsavel/filhos/{cenario['aluno'].id}/boletim/",
        **auth_headers(cenario["responsavel"]),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["aluno_id"] == cenario["aluno"].id
    assert "exercicios" in body and "provas" in body


@pytest.mark.django_db
def test_responsavel_acessa_boletim_filho_nao_vinculado_retorna_403(
    client, cenario, auth_headers
):
    resp = client.get(
        f"/api/app/responsavel/filhos/{cenario['aluno_outra'].id}/boletim/",
        **auth_headers(cenario["responsavel"]),
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_boletim_filtro_por_disciplina(
    client, cenario, auth_headers, make_atividade
):
    make_atividade(
        turma=cenario["turma"], criado_por=cenario["professor"],
        disciplina="Matemática",
    )
    make_atividade(
        turma=cenario["turma"], criado_por=cenario["professor"],
        disciplina="Português",
    )
    resp = client.get(
        f"/api/app/responsavel/filhos/{cenario['aluno'].id}/boletim/?disciplina=Matemática",
        **auth_headers(cenario["responsavel"]),
    )
    assert resp.status_code == 200
    body = resp.json()
    todas = body["provas"] + body["exercicios"]
    assert all(item["disciplina"] == "Matemática" for item in todas)


@pytest.mark.django_db
def test_listar_responsaveis_inclui_alunos_vinculados(
    client, cenario, auth_headers
):
    """Frontend renderiza cards de responsáveis com a lista de filhos; o
    endpoint precisa devolver `alunos: [{id, nome, turma_nome}]` para evitar
    requests N+1."""
    resp = client.get(
        "/api/saas/responsaveis/",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 200, resp.content
    body = resp.json()
    assert "results" in body
    encontrado = next(
        (r for r in body["results"] if r["id"] == cenario["responsavel"].id),
        None,
    )
    assert encontrado is not None, body
    assert encontrado["qtd_filhos"] == 1
    assert isinstance(encontrado["alunos"], list)
    assert encontrado["alunos"][0]["id"] == cenario["aluno"].id
    assert encontrado["alunos"][0]["turma_nome"] == cenario["turma"].nome
