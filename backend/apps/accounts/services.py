"""Domain services for the accounts app."""
from __future__ import annotations

import logging
import secrets
import string

from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from django.db import IntegrityError, transaction
from ninja.errors import HttpError
from ninja_jwt.tokens import RefreshToken

from apps.accounts.models import PasswordResetToken, Usuario
from apps.escolas.models import Escola

logger = logging.getLogger("skillflow.accounts")


def gerar_senha_provisoria(length: int = 10) -> str:
    """Generate a strong-ish provisional password (letters + digits)."""
    alphabet = string.ascii_letters + string.digits
    while True:
        candidate = "".join(secrets.choice(alphabet) for _ in range(length))
        if (
            any(c.islower() for c in candidate)
            and any(c.isupper() for c in candidate)
            and any(c.isdigit() for c in candidate)
        ):
            return candidate


def issue_tokens_for(user: Usuario) -> dict:
    """Build JWT pair embedding the `must_change_password` claim."""
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    refresh["must_change_password"] = bool(user.senha_provisoria)
    access = refresh.access_token
    access["role"] = user.role
    access["must_change_password"] = bool(user.senha_provisoria)
    return {
        "access_token": str(access),
        "refresh_token": str(refresh),
        "role": user.role,
        "must_change_password": bool(user.senha_provisoria),
    }


@transaction.atomic
def criar_escola_e_coordenador(payload) -> tuple[Escola, Usuario]:
    """Public onboarding: create Escola + Coordenador in a single transaction."""
    if Usuario.objects.filter(email__iexact=payload.coordenador_email).exists():
        raise HttpError(409, "E-mail já cadastrado.")
    if Escola.objects.filter(
        nome=payload.escola_nome, cnpj=payload.escola_cnpj
    ).exists():
        raise HttpError(409, "Escola já cadastrada com este CNPJ e nome.")

    try:
        escola = Escola.objects.create(
            nome=payload.escola_nome.strip(),
            cnpj=payload.escola_cnpj.strip(),
        )
    except IntegrityError as exc:
        raise HttpError(409, "Conflito ao criar escola.") from exc

    nome = payload.coordenador_nome.strip()
    first_name, _, last_name = nome.partition(" ")
    coordenador = Usuario.objects.create_user(
        email=payload.coordenador_email.strip().lower(),
        password=payload.coordenador_senha,
        username=payload.coordenador_email.strip().lower(),
        first_name=first_name,
        last_name=last_name,
        role=Usuario.Role.COORDENADOR,
        escola=escola,
        senha_provisoria=False,
    )
    return escola, coordenador


def autenticar(email: str, senha: str) -> Usuario:
    user = authenticate(username=email.strip().lower(), password=senha)
    if user is None:
        raise HttpError(401, "Credenciais inválidas.")
    return user


def trocar_senha(user: Usuario, senha_atual: str, nova_senha: str) -> None:
    if not check_password(senha_atual, user.password):
        raise HttpError(400, "Senha atual incorreta.")
    if len(nova_senha) < 8:
        raise HttpError(400, "Nova senha deve ter pelo menos 8 caracteres.")
    user.set_password(nova_senha)
    user.senha_provisoria = False
    user.save(update_fields=["password", "senha_provisoria", "updated_at"])


def emitir_token_reset(email: str) -> str | None:
    """Always return 200 to the client, but only issues a token if the email exists.

    We log the token in dev (`logger.info`) instead of sending an email.
    """
    user = Usuario.objects.filter(email__iexact=email).first()
    if not user:
        logger.info("Reset solicitado para email inexistente: %s", email)
        return None
    _token, plain = PasswordResetToken.issue_for(user)
    logger.info("[DEV] Token de reset para %s = %s", user.email, plain)
    return plain


def aplicar_reset(token_plain: str, nova_senha: str) -> None:
    if len(nova_senha) < 8:
        raise HttpError(400, "Nova senha deve ter pelo menos 8 caracteres.")
    candidatos = PasswordResetToken.objects.filter(usado_em__isnull=True).order_by(
        "-criado_em"
    )
    for token in candidatos:
        if check_password(token_plain, token.token_hash):
            if not token.is_valid():
                raise HttpError(400, "Token expirado.")
            user = token.usuario
            user.set_password(nova_senha)
            user.senha_provisoria = False
            user.save(update_fields=["password", "senha_provisoria", "updated_at"])
            from django.utils import timezone

            token.usado_em = timezone.now()
            token.save(update_fields=["usado_em"])
            return
    raise HttpError(400, "Token inválido.")
