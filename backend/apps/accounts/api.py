"""Authentication routes — `/api/auth/*`."""
from __future__ import annotations

import logging

from django.utils import timezone
from ninja import Router
from ninja.errors import HttpError
from ninja_jwt.exceptions import TokenError
from ninja_jwt.tokens import RefreshToken

from apps.accounts.auth import jwt_auth, require_aluno, require_roles
from apps.accounts.models import Usuario
from apps.accounts.schemas import (
    CadastroEscolaIn,
    CadastroEscolaOut,
    DeviceTokenIn,
    EsqueciSenhaIn,
    LoginIn,
    LoginOut,
    LogoutIn,
    MessageOut,
    RefreshIn,
    RefreshOut,
    ResetSenhaIn,
    ServerTimeOut,
    TrocarSenhaIn,
)
from apps.accounts.services import (
    aplicar_reset,
    autenticar,
    criar_escola_e_coordenador,
    emitir_token_reset,
    issue_tokens_for,
    trocar_senha,
)

logger = logging.getLogger("skillflow.accounts.api")

auth_router = Router(tags=["auth"])


def _serialize_auth_user(user: Usuario) -> dict:
    """Build the nested `user` object expected by the SaaS frontend and the
    mobile app. Kept in one place so login and cadastro-escola stay in sync."""
    nome = (f"{user.first_name} {user.last_name}").strip() or user.email
    escola = getattr(user, "escola", None)
    turma = getattr(user, "turma", None)
    return {
        "id": user.id,
        "email": user.email,
        "nome": nome,
        "role": user.role,
        "must_change_password": bool(user.senha_provisoria),
        "escola_id": user.escola_id,
        "escola_nome": getattr(escola, "nome", None),
        "turma_id": user.turma_id,
        "turma_nome": getattr(turma, "nome", None),
    }


@auth_router.post(
    "/cadastro-escola/",
    response={201: CadastroEscolaOut, 409: MessageOut, 400: MessageOut},
    auth=None,
)
def cadastro_escola(request, payload: CadastroEscolaIn):
    """Public onboarding for Coordenador/Diretor + Escola in one transaction."""
    if len(payload.coordenador_senha) < 8:
        raise HttpError(400, "Senha deve ter pelo menos 8 caracteres.")
    escola, coordenador = criar_escola_e_coordenador(payload)
    tokens = issue_tokens_for(coordenador)
    return 201, {
        "escola_id": escola.id,
        "coordenador_id": coordenador.id,
        **tokens,
        "user": _serialize_auth_user(coordenador),
    }


@auth_router.post(
    "/login/", response={200: LoginOut, 401: MessageOut}, auth=None
)
def login(request, payload: LoginIn):
    user = autenticar(payload.email, payload.senha)
    tokens = issue_tokens_for(user)
    serialized = _serialize_auth_user(user)
    return {
        **tokens,
        "usuario_id": user.id,
        "nome": serialized["nome"],
        "user": serialized,
    }


@auth_router.post(
    "/refresh/", response={200: RefreshOut, 401: MessageOut}, auth=None
)
def refresh(request, payload: RefreshIn):
    try:
        token = RefreshToken(payload.refresh_token)
        token.verify()
    except TokenError as exc:
        raise HttpError(401, f"Token inválido: {exc}") from exc

    rotated = None
    try:
        token.blacklist()
        new_refresh = RefreshToken.for_user(
            Usuario.objects.get(id=token["user_id"])
        )
        new_refresh["role"] = token.get("role")
        new_refresh["must_change_password"] = token.get(
            "must_change_password", False
        )
        rotated = str(new_refresh)
        access = str(new_refresh.access_token)
    except AttributeError:
        # blacklist not enabled — fall back to issuing a fresh access only.
        access = str(token.access_token)
    return {"access_token": access, "refresh_token": rotated}


@auth_router.post(
    "/trocar-senha/",
    response={200: MessageOut, 400: MessageOut},
    auth=jwt_auth,
)
def trocar_senha_view(request, payload: TrocarSenhaIn):
    user = request.user
    trocar_senha(user, payload.senha_atual, payload.nova_senha)
    return {"detail": "Senha atualizada."}


@auth_router.post(
    "/esqueci-senha/", response={200: MessageOut}, auth=None
)
def esqueci_senha(request, payload: EsqueciSenhaIn):
    emitir_token_reset(payload.email)
    return {
        "detail": "Se o e-mail existir, um token de reset foi enviado."
    }


@auth_router.post(
    "/reset-senha/",
    response={200: MessageOut, 400: MessageOut},
    auth=None,
)
def reset_senha(request, payload: ResetSenhaIn):
    aplicar_reset(payload.token, payload.nova_senha)
    return {"detail": "Senha redefinida com sucesso."}


@auth_router.post(
    "/logout/",
    response={200: MessageOut, 400: MessageOut, 401: MessageOut},
    auth=jwt_auth,
)
def logout(request, payload: LogoutIn):
    raw_token = payload.refresh_token or payload.refresh
    if not raw_token:
        raise HttpError(400, "Refresh token ausente.")
    try:
        token = RefreshToken(raw_token)
        if token["user_id"] != request.user.id:
            raise HttpError(401, "Token não pertence a este usuário.")
        try:
            token.blacklist()
        except AttributeError:
            pass
    except TokenError as exc:
        raise HttpError(401, f"Token inválido: {exc}") from exc
    return {"detail": "Logout efetuado."}


# ----------------------------------------------------- mobile-only meta routes
mobile_meta_router = Router(tags=["mobile-meta"])


@mobile_meta_router.get("/sync/server-time/", response=ServerTimeOut, auth=None)
def server_time(request):
    """Return current server time so the app can compute clock offset."""
    now = timezone.now()
    return {"server_time": now, "epoch_ms": int(now.timestamp() * 1000)}


@mobile_meta_router.post(
    "/device-token/",
    response={200: MessageOut, 403: MessageOut},
    auth=jwt_auth,
)
def registrar_device_token(request, payload: DeviceTokenIn):
    """Save FCM token. Only ALUNO is allowed (responsáveis don't get push)."""
    user = require_aluno(request)
    user.fcm_device_token = payload.token
    user.save(update_fields=["fcm_device_token", "updated_at"])
    return {"detail": "Token registrado."}
