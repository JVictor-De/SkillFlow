"""Cross-cutting role/tenant permission tests."""
from __future__ import annotations

import json

import pytest

from apps.accounts.models import Usuario


@pytest.mark.django_db
def test_aluno_nao_acessa_rota_saas_retorna_403(client, cenario, auth_headers):
    resp = client.get(
        "/api/saas/turmas/", **auth_headers(cenario["aluno"])
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_professor_nao_acessa_rota_app_retorna_403(client, cenario, auth_headers):
    resp = client.get(
        "/api/app/atividades/", **auth_headers(cenario["professor"])
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_responsavel_nao_acessa_rota_saas_retorna_403(client, cenario, auth_headers):
    resp = client.get(
        "/api/saas/turmas/", **auth_headers(cenario["responsavel"])
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_responsavel_nao_acessa_rota_app_aluno_retorna_403(
    client, cenario, auth_headers
):
    resp = client.get(
        "/api/app/atividades/", **auth_headers(cenario["responsavel"])
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_aluno_nao_acessa_rota_app_responsavel_retorna_403(
    client, cenario, auth_headers
):
    resp = client.get(
        "/api/app/responsavel/filhos/", **auth_headers(cenario["aluno"])
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_professor_nao_acessa_turma_que_nao_pertence_retorna_403(
    client, cenario, auth_headers
):
    resp = client.get(
        f"/api/saas/turmas/{cenario['turma_outra'].id}/alunos/",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_coordenador_acessa_qualquer_turma_da_sua_escola(
    client, cenario, auth_headers
):
    resp = client.get(
        f"/api/saas/turmas/{cenario['turma'].id}/alunos/",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 200


@pytest.mark.django_db
def test_coordenador_nao_acessa_turma_de_outra_escola(
    client, cenario, auth_headers
):
    resp = client.get(
        f"/api/saas/turmas/{cenario['turma_outra'].id}/alunos/",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_professor_nao_pode_transferir_aluno_retorna_403(
    client, cenario, auth_headers
):
    resp = client.put(
        f"/api/saas/alunos/{cenario['aluno'].id}/transferir-turma/",
        data=json.dumps({"nova_turma_id": cenario["turma_outra"].id}),
        content_type="application/json",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_coordenador_pode_transferir_aluno_da_propria_escola(
    client, cenario, auth_headers, make_turma
):
    nova = make_turma(escola=cenario["escola"], nome="2A")
    resp = client.put(
        f"/api/saas/alunos/{cenario['aluno'].id}/transferir-turma/",
        data=json.dumps({"nova_turma_id": nova.id}),
        content_type="application/json",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 200
    cenario["aluno"].refresh_from_db()
    assert cenario["aluno"].turma_id == nova.id


@pytest.mark.django_db
def test_professor_nao_pode_cadastrar_professor_retorna_403(
    client, cenario, auth_headers
):
    resp = client.post(
        "/api/saas/professores/cadastrar/",
        data=json.dumps({"nome": "X Y", "email": "novo@test.com"}),
        content_type="application/json",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_coordenador_vincula_professor_a_turma_da_escola(
    client, cenario, auth_headers
):
    resp = client.post(
        f"/api/saas/professores/{cenario['professor_alheio'].id}/vincular-turma/",
        data=json.dumps({"turma_id": cenario["turma"].id}),
        content_type="application/json",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 201


@pytest.mark.django_db
def test_coordenador_nao_vincula_professor_a_turma_de_outra_escola(
    client, cenario, auth_headers
):
    resp = client.post(
        f"/api/saas/professores/{cenario['professor_alheio'].id}/vincular-turma/",
        data=json.dumps({"turma_id": cenario["turma_outra"].id}),
        content_type="application/json",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 403
