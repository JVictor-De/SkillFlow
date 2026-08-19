"""Gestão tests — cadastrar aluno/professor, transferir, vincular, histórico."""
from __future__ import annotations

import json

import pytest

from apps.accounts.models import Usuario
from apps.escolas.models import ProfessorTurma, Turma
from apps.submissoes.models import Submissao


@pytest.mark.django_db
def test_cadastrar_aluno_gera_senha_provisoria_e_vincula_turma(
    client, cenario, auth_headers
):
    resp = client.post(
        f"/api/saas/turmas/{cenario['turma'].id}/alunos/cadastrar/",
        data=json.dumps({"nome": "João Aluno", "email": "joao@test.com"}),
        content_type="application/json",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 201, resp.content
    body = resp.json()
    assert body["senha_provisoria"]
    aluno = Usuario.objects.get(email="joao@test.com")
    assert aluno.role == Usuario.Role.ALUNO
    assert aluno.turma_id == cenario["turma"].id
    assert aluno.senha_provisoria is True


@pytest.mark.django_db
def test_transferir_aluno_muda_turma_preserva_historico(
    client, cenario, auth_headers, make_atividade, make_turma
):
    nova = make_turma(escola=cenario["escola"], nome="N1")
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=atv.exercicios.get(ordem=1),
        resposta_texto="C", nota_calculada=100,
        status=Submissao.Status.CORRIGIDA,
    )
    resp = client.put(
        f"/api/saas/alunos/{cenario['aluno'].id}/transferir-turma/",
        data=json.dumps({"nova_turma_id": nova.id}),
        content_type="application/json",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 200
    cenario["aluno"].refresh_from_db()
    assert cenario["aluno"].turma_id == nova.id
    # Histórico preservado
    assert Submissao.objects.filter(aluno=cenario["aluno"]).count() == 1


@pytest.mark.django_db
def test_cadastrar_professor_pelo_coordenador(client, cenario, auth_headers):
    resp = client.post(
        "/api/saas/professores/cadastrar/",
        data=json.dumps({"nome": "Novo Prof", "email": "novop@test.com"}),
        content_type="application/json",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 201, resp.content
    prof = Usuario.objects.get(email="novop@test.com")
    assert prof.role == Usuario.Role.PROFESSOR


@pytest.mark.django_db
def test_vincular_e_desvincular_professor_a_turma(client, cenario, auth_headers):
    resp = client.post(
        f"/api/saas/professores/{cenario['professor_alheio'].id}/vincular-turma/",
        data=json.dumps({"turma_id": cenario["turma"].id}),
        content_type="application/json",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 201
    assert ProfessorTurma.objects.filter(
        professor=cenario["professor_alheio"], turma=cenario["turma"]
    ).exists()
    resp = client.delete(
        f"/api/saas/professores/{cenario['professor_alheio'].id}/desvincular-turma/",
        data=json.dumps({"turma_id": cenario["turma"].id}),
        content_type="application/json",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 200
    assert not ProfessorTurma.objects.filter(
        professor=cenario["professor_alheio"], turma=cenario["turma"]
    ).exists()


@pytest.mark.django_db
def test_historico_cross_turma_retorna_submissoes_antigas(
    client, cenario, auth_headers, make_atividade
):
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=atv.exercicios.get(ordem=1),
        resposta_texto="C", nota_calculada=100,
        status=Submissao.Status.CORRIGIDA,
    )
    resp = client.get(
        f"/api/saas/alunos/{cenario['aluno'].id}/historico/",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["nota"] == 100


@pytest.mark.django_db
def test_detalhe_turma_retorna_dados_completos(client, cenario, auth_headers):
    resp = client.get(
        f"/api/saas/turmas/{cenario['turma'].id}/",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 200, resp.content
    body = resp.json()
    assert body["id"] == cenario["turma"].id
    assert body["nome"] == cenario["turma"].nome
    assert body["escola_nome"] == cenario["escola"].nome
    assert "qtd_alunos" in body
    assert "qtd_atividades" in body


@pytest.mark.django_db
def test_detalhe_turma_negada_para_outra_escola(client, cenario, auth_headers):
    resp = client.get(
        f"/api/saas/turmas/{cenario['turma_outra'].id}/",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_listar_professores_da_escola_pelo_coordenador(
    client, cenario, auth_headers
):
    resp = client.get(
        "/api/saas/professores/",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 200, resp.content
    body = resp.json()
    assert "results" in body
    emails = {p["email"] for p in body["results"]}
    assert cenario["professor"].email in emails
    # professor_alheio não tem vínculo na escola, não deve aparecer
    assert cenario["professor_alheio"].email not in emails


@pytest.mark.django_db
def test_listar_professores_negado_para_professor(client, cenario, auth_headers):
    resp = client.get(
        "/api/saas/professores/",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Cadastro de turma — POST /api/saas/turmas/
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_cadastrar_turma_pelo_coordenador_vincula_escola(
    client, cenario, auth_headers
):
    resp = client.post(
        "/api/saas/turmas/",
        data=json.dumps({"nome": "3º Ano B"}),
        content_type="application/json",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 201, resp.content
    body = resp.json()
    assert body["nome"] == "3º Ano B"
    assert body["escola_id"] == cenario["escola"].id
    assert body["escola_nome"] == cenario["escola"].nome
    assert body["qtd_alunos"] == 0
    assert body["qtd_atividades"] == 0
    turma = Turma.objects.get(id=body["id"])
    assert turma.escola_id == cenario["escola"].id


@pytest.mark.django_db
def test_cadastrar_turma_normaliza_nome_com_espacos(client, cenario, auth_headers):
    resp = client.post(
        "/api/saas/turmas/",
        data=json.dumps({"nome": "   1º Ano X   "}),
        content_type="application/json",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 201, resp.content
    assert resp.json()["nome"] == "1º Ano X"


@pytest.mark.django_db
def test_cadastrar_turma_negada_para_professor(client, cenario, auth_headers):
    resp = client.post(
        "/api/saas/turmas/",
        data=json.dumps({"nome": "Nova Turma"}),
        content_type="application/json",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_cadastrar_turma_negada_para_aluno(client, cenario, auth_headers):
    resp = client.post(
        "/api/saas/turmas/",
        data=json.dumps({"nome": "Nova Turma"}),
        content_type="application/json",
        **auth_headers(cenario["aluno"]),
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_cadastrar_turma_negada_para_responsavel(client, cenario, auth_headers):
    resp = client.post(
        "/api/saas/turmas/",
        data=json.dumps({"nome": "Nova Turma"}),
        content_type="application/json",
        **auth_headers(cenario["responsavel"]),
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_cadastrar_turma_sem_auth_retorna_401(client):
    resp = client.post(
        "/api/saas/turmas/",
        data=json.dumps({"nome": "Sem auth"}),
        content_type="application/json",
    )
    assert resp.status_code == 401


@pytest.mark.django_db
def test_cadastrar_turma_nome_vazio_retorna_400(client, cenario, auth_headers):
    resp = client.post(
        "/api/saas/turmas/",
        data=json.dumps({"nome": "   "}),
        content_type="application/json",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_cadastrar_turma_nome_duplicado_na_escola_retorna_409(
    client, cenario, auth_headers
):
    # cenario['turma'] já existe com nome "1A" na escola do coordenador.
    resp = client.post(
        "/api/saas/turmas/",
        data=json.dumps({"nome": cenario["turma"].nome}),
        content_type="application/json",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 409


@pytest.mark.django_db
def test_cadastrar_turma_nome_pode_repetir_em_escolas_diferentes(
    client, cenario, auth_headers
):
    # Coordenador da outra escola consegue criar uma turma com nome 1A,
    # mesmo que já exista em outra escola: o unique_together é por escola.
    resp = client.post(
        "/api/saas/turmas/",
        data=json.dumps({"nome": "1A"}),
        content_type="application/json",
        **auth_headers(cenario["coordenador_outra"]),
    )
    assert resp.status_code == 201, resp.content
    assert resp.json()["escola_id"] == cenario["outra_escola"].id


@pytest.mark.django_db
def test_cadastrar_turma_aparece_na_listagem_do_coordenador(
    client, cenario, auth_headers
):
    resp = client.post(
        "/api/saas/turmas/",
        data=json.dumps({"nome": "9º Z"}),
        content_type="application/json",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 201
    nova_id = resp.json()["id"]

    listagem = client.get(
        "/api/saas/turmas/", **auth_headers(cenario["coordenador"])
    )
    assert listagem.status_code == 200
    ids = {row["id"] for row in listagem.json()["results"]}
    assert nova_id in ids


@pytest.mark.django_db
def test_cadastrar_turma_nao_aparece_para_outra_escola(
    client, cenario, auth_headers
):
    resp = client.post(
        "/api/saas/turmas/",
        data=json.dumps({"nome": "4º X"}),
        content_type="application/json",
        **auth_headers(cenario["coordenador"]),
    )
    assert resp.status_code == 201
    nova_id = resp.json()["id"]

    listagem = client.get(
        "/api/saas/turmas/", **auth_headers(cenario["coordenador_outra"])
    )
    assert listagem.status_code == 200
    ids = {row["id"] for row in listagem.json()["results"]}
    assert nova_id not in ids
