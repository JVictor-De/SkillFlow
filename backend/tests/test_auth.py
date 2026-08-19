"""Auth flow tests — login, refresh, esqueci/reset, logout, must_change_password."""
from __future__ import annotations

import json

import pytest

from apps.accounts.models import PasswordResetToken, Usuario


@pytest.mark.django_db
def test_cadastro_escola_cria_escola_e_coordenador_em_uma_transacao(client):
    payload = {
        "escola_nome": "Colégio Trans",
        "escola_cnpj": "10.000.000/0001-99",
        "coordenador_nome": "Roberto Diretor",
        "coordenador_email": "diretor@test.com",
        "coordenador_senha": "SenhaSegura123",
    }
    resp = client.post(
        "/api/auth/cadastro-escola/",
        data=json.dumps(payload),
        content_type="application/json",
    )
    assert resp.status_code == 201, resp.content
    body = resp.json()
    assert "access_token" in body and "refresh_token" in body
    assert body["role"] == Usuario.Role.COORDENADOR
    assert body["must_change_password"] is False
    user = Usuario.objects.get(email="diretor@test.com")
    assert user.escola_id == body["escola_id"]


@pytest.mark.django_db
def test_cadastro_escola_email_duplicado_retorna_409(client, make_user):
    make_user(role=Usuario.Role.COORDENADOR, email="dup@test.com",
              escola=None) and None  # noqa: B018
    # Recreate user with proper escola.
    Usuario.objects.filter(email="dup@test.com").delete()
    from apps.escolas.models import Escola

    escola = Escola.objects.create(nome="X", cnpj="99.999.999/0001-99")
    Usuario.objects.create_user(
        email="dup@test.com",
        password="SenhaForte123",
        username="dup@test.com",
        role=Usuario.Role.COORDENADOR,
        escola=escola,
        senha_provisoria=False,
    )
    payload = {
        "escola_nome": "Outro Colégio",
        "escola_cnpj": "00.000.000/0001-99",
        "coordenador_nome": "X",
        "coordenador_email": "dup@test.com",
        "coordenador_senha": "SenhaSegura123",
    }
    resp = client.post(
        "/api/auth/cadastro-escola/",
        data=json.dumps(payload),
        content_type="application/json",
    )
    assert resp.status_code == 409


@pytest.mark.django_db
def test_login_sucesso_retorna_jwt_e_role(client, make_user):
    make_user(email="login@test.com", senha="MinhaSenha123",
              role=Usuario.Role.PROFESSOR)
    resp = client.post(
        "/api/auth/login/",
        data=json.dumps({"email": "login@test.com", "senha": "MinhaSenha123"}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["role"] == Usuario.Role.PROFESSOR
    assert body["must_change_password"] is False
    assert body["access_token"]


@pytest.mark.django_db
def test_login_senha_errada_retorna_401(client, make_user):
    make_user(email="erra@test.com", senha="CertaSenha123")
    resp = client.post(
        "/api/auth/login/",
        data=json.dumps({"email": "erra@test.com", "senha": "errada"}),
        content_type="application/json",
    )
    assert resp.status_code == 401


@pytest.mark.django_db
def test_login_aluno_retorna_must_change_password_true(
    client, make_user, make_turma
):
    turma = make_turma()
    make_user(
        email="alu@test.com",
        senha="QualquerSenha1",
        role=Usuario.Role.ALUNO,
        turma=turma,
        senha_provisoria=True,
    )
    resp = client.post(
        "/api/auth/login/",
        data=json.dumps({"email": "alu@test.com", "senha": "QualquerSenha1"}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    assert resp.json()["must_change_password"] is True


@pytest.mark.django_db
def test_trocar_senha_atualiza_e_seta_provisoria_false(
    client, make_user, auth_headers
):
    user = make_user(senha="VelhaForte123", senha_provisoria=True)
    resp = client.post(
        "/api/auth/trocar-senha/",
        data=json.dumps(
            {"senha_atual": "VelhaForte123", "nova_senha": "NovaForte456"}
        ),
        content_type="application/json",
        **auth_headers(user),
    )
    assert resp.status_code == 200
    user.refresh_from_db()
    assert user.senha_provisoria is False
    assert user.check_password("NovaForte456")


@pytest.mark.django_db
def test_refresh_token_retorna_novo_access(client, make_user):
    make_user(email="ref@test.com", senha="SenhaForte123")
    login = client.post(
        "/api/auth/login/",
        data=json.dumps({"email": "ref@test.com", "senha": "SenhaForte123"}),
        content_type="application/json",
    )
    refresh_token = login.json()["refresh_token"]
    resp = client.post(
        "/api/auth/refresh/",
        data=json.dumps({"refresh_token": refresh_token}),
        content_type="application/json",
    )
    assert resp.status_code == 200, resp.content
    assert resp.json()["access_token"]


@pytest.mark.django_db
def test_esqueci_senha_email_inexistente_retorna_200(client):
    resp = client.post(
        "/api/auth/esqueci-senha/",
        data=json.dumps({"email": "ninguem@test.com"}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    assert PasswordResetToken.objects.count() == 0


@pytest.mark.django_db
def test_reset_senha_aplica_token_valido(client, make_user, caplog):
    user = make_user(email="reset@test.com")
    from apps.accounts.services import emitir_token_reset

    plain = emitir_token_reset("reset@test.com")
    assert plain
    resp = client.post(
        "/api/auth/reset-senha/",
        data=json.dumps({"token": plain, "nova_senha": "NovaSenhaForte123"}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    user.refresh_from_db()
    assert user.check_password("NovaSenhaForte123")
    assert user.senha_provisoria is False


@pytest.mark.django_db
def test_logout_invalida_refresh_token(client, make_user, auth_headers):
    user = make_user(email="lo@test.com", senha="SenhaForte123")
    login = client.post(
        "/api/auth/login/",
        data=json.dumps({"email": "lo@test.com", "senha": "SenhaForte123"}),
        content_type="application/json",
    )
    refresh = login.json()["refresh_token"]
    resp = client.post(
        "/api/auth/logout/",
        data=json.dumps({"refresh_token": refresh}),
        content_type="application/json",
        **auth_headers(user),
    )
    assert resp.status_code == 200
    # Trying to refresh after blacklist must fail.
    resp2 = client.post(
        "/api/auth/refresh/",
        data=json.dumps({"refresh_token": refresh}),
        content_type="application/json",
    )
    assert resp2.status_code == 401


@pytest.mark.django_db
def test_logout_aceita_payload_legado_refresh(client, make_user, auth_headers):
    """Algumas versões antigas do app/web enviavam {refresh: ...} no logout."""
    user = make_user(email="lo2@test.com", senha="SenhaForte123")
    login = client.post(
        "/api/auth/login/",
        data=json.dumps({"email": "lo2@test.com", "senha": "SenhaForte123"}),
        content_type="application/json",
    )
    refresh = login.json()["refresh_token"]
    resp = client.post(
        "/api/auth/logout/",
        data=json.dumps({"refresh": refresh}),
        content_type="application/json",
        **auth_headers(user),
    )
    assert resp.status_code == 200, resp.content


@pytest.mark.django_db
def test_logout_sem_token_retorna_400(client, make_user, auth_headers):
    user = make_user(email="lo3@test.com", senha="SenhaForte123")
    resp = client.post(
        "/api/auth/logout/",
        data=json.dumps({}),
        content_type="application/json",
        **auth_headers(user),
    )
    assert resp.status_code == 400
