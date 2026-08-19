"""Pydantic schemas exposed by the auth router."""
from __future__ import annotations

from datetime import datetime

from ninja import Schema


class CadastroEscolaIn(Schema):
    escola_nome: str
    escola_cnpj: str
    coordenador_nome: str
    coordenador_email: str
    coordenador_senha: str


class AuthUserOut(Schema):
    """Nested user payload used by `/auth/login` and `/auth/cadastro-escola`.

    Both the Next.js frontend and the Flutter mobile expect the session to
    contain a `user` object, so we serialize it here as a single source of
    truth.
    """

    id: int
    email: str
    nome: str | None = None
    role: str
    must_change_password: bool
    escola_id: int | None = None
    escola_nome: str | None = None
    turma_id: int | None = None
    turma_nome: str | None = None


class CadastroEscolaOut(Schema):
    escola_id: int
    coordenador_id: int
    access_token: str
    refresh_token: str
    role: str
    must_change_password: bool
    user: AuthUserOut


class LoginIn(Schema):
    email: str
    senha: str


class LoginOut(Schema):
    access_token: str
    refresh_token: str
    role: str
    must_change_password: bool
    usuario_id: int
    nome: str
    user: AuthUserOut


class RefreshIn(Schema):
    refresh_token: str


class RefreshOut(Schema):
    access_token: str
    refresh_token: str | None = None


class TrocarSenhaIn(Schema):
    senha_atual: str
    nova_senha: str


class EsqueciSenhaIn(Schema):
    email: str


class ResetSenhaIn(Schema):
    token: str
    nova_senha: str


class LogoutIn(Schema):
    refresh_token: str | None = None
    refresh: str | None = None


class MessageOut(Schema):
    detail: str


class ServerTimeOut(Schema):
    server_time: datetime
    epoch_ms: int


class DeviceTokenIn(Schema):
    token: str
