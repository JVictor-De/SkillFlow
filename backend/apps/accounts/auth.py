"""JWT authentication and role-based authorisation helpers for Django Ninja."""
from __future__ import annotations

from typing import Iterable

from django.http import HttpRequest
from ninja.errors import HttpError
from ninja_jwt.authentication import JWTAuth

from apps.accounts.models import Usuario


class JWTAuthCurrentUser(JWTAuth):
    """JWTAuth subclass that attaches `request.user` for the rest of the view."""

    def authenticate(self, request: HttpRequest, token: str):  # type: ignore[override]
        user = super().authenticate(request, token)
        if user is None:
            return None
        request.user = user
        return user


jwt_auth = JWTAuthCurrentUser()


def require_roles(request: HttpRequest, *roles: str) -> Usuario:
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        raise HttpError(401, "Não autenticado.")
    if user.role not in roles:
        raise HttpError(403, "Acesso negado para este perfil.")
    return user


def require_aluno(request: HttpRequest) -> Usuario:
    return require_roles(request, Usuario.Role.ALUNO)


def require_responsavel(request: HttpRequest) -> Usuario:
    return require_roles(request, Usuario.Role.RESPONSAVEL)


def require_docente(request: HttpRequest) -> Usuario:
    return require_roles(
        request, Usuario.Role.PROFESSOR, Usuario.Role.COORDENADOR
    )


def require_coordenador(request: HttpRequest) -> Usuario:
    return require_roles(request, Usuario.Role.COORDENADOR)


def assert_in_roles(user: Usuario, roles: Iterable[str]) -> None:
    if user.role not in roles:
        raise HttpError(403, "Acesso negado para este perfil.")
