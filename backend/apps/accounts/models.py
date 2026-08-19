"""Models for `accounts`: Usuario and PasswordResetToken.

Business rules enforced here mirror sections 4.x of TechSpecs.md and the role
matrix in PRD.md §2.
"""
from __future__ import annotations

import secrets
import string
from datetime import timedelta

from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from .managers import UsuarioManager


class Usuario(AbstractUser):
    """SkillFlow user — exists across all four roles (ALUNO, PROFESSOR,
    COORDENADOR, RESPONSAVEL).

    The `turma` and `escola` foreign keys carry the multi-tenant scope:
    - ALUNO must have `turma_id` (escola is inferred via turma.escola)
    - COORDENADOR / RESPONSAVEL must have `escola_id`
    - PROFESSOR has neither (their schools are inferred from ProfessorTurma)
    """

    class Role(models.TextChoices):
        ALUNO = "ALUNO", "Aluno"
        PROFESSOR = "PROFESSOR", "Professor"
        COORDENADOR = "COORDENADOR", "Coordenador"
        RESPONSAVEL = "RESPONSAVEL", "Responsável"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=15, choices=Role.choices)
    turma = models.ForeignKey(
        "escolas.Turma",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="alunos",
    )
    escola = models.ForeignKey(
        "escolas.Escola",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="usuarios_com_escopo",
    )
    fcm_device_token = models.CharField(max_length=255, null=True, blank=True)
    senha_provisoria = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    objects = UsuarioManager()

    class Meta:
        indexes = [
            models.Index(fields=["role"], name="idx_usuarios_role"),
            models.Index(fields=["turma"], name="idx_usuarios_turma"),
            models.Index(fields=["escola"], name="idx_usuarios_escola"),
        ]

    def __str__(self) -> str:
        return f"{self.email} ({self.role})"

    # ---------------------------------------------------------------- helpers
    @property
    def is_aluno(self) -> bool:
        return self.role == self.Role.ALUNO

    @property
    def is_professor(self) -> bool:
        return self.role == self.Role.PROFESSOR

    @property
    def is_coordenador(self) -> bool:
        return self.role == self.Role.COORDENADOR

    @property
    def is_responsavel(self) -> bool:
        return self.role == self.Role.RESPONSAVEL

    @property
    def escola_efetiva_id(self):
        """Escola scope used for tenant filtering.

        - ALUNO: turma.escola_id
        - COORDENADOR / RESPONSAVEL: own escola_id
        - PROFESSOR: None (computed via ProfessorTurma when needed)
        """
        if self.is_aluno and self.turma_id:
            return self.turma.escola_id  # type: ignore[union-attr]
        return self.escola_id

    def clean(self):
        super().clean()
        # Guard against DB-level role/relation mismatches at the form layer.
        if self.role != self.Role.ALUNO and self.turma_id is not None:
            raise ValidationError(
                "Apenas alunos podem ter turma vinculada."
            )
        if self.role == self.Role.ALUNO and self.turma_id is None:
            raise ValidationError(
                "Alunos devem ter uma turma vinculada."
            )
        scope_roles = {self.Role.COORDENADOR, self.Role.RESPONSAVEL}
        if self.role not in scope_roles and self.escola_id is not None:
            raise ValidationError(
                "Apenas coordenadores e responsáveis podem ter escola vinculada."
            )
        if self.role in scope_roles and self.escola_id is None:
            raise ValidationError(
                "Coordenadores e responsáveis devem ter uma escola vinculada."
            )


class PasswordResetToken(models.Model):
    """Single-use, hashed reset token (TTL 30 min by default)."""

    DEFAULT_TTL_MINUTES = 30

    usuario = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, related_name="password_reset_tokens"
    )
    token_hash = models.CharField(max_length=128, unique=True)
    expira_em = models.DateTimeField()
    usado_em = models.DateTimeField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]

    def is_valid(self) -> bool:
        return self.usado_em is None and timezone.now() <= self.expira_em

    @staticmethod
    def generate_token(length: int = 48) -> str:
        alphabet = string.ascii_letters + string.digits
        return "".join(secrets.choice(alphabet) for _ in range(length))

    @classmethod
    def issue_for(cls, usuario: Usuario, ttl_minutes: int | None = None) -> tuple["PasswordResetToken", str]:
        """Create a new token and return both the persisted instance and the
        plain (uniquely identifying) value to surface to the caller exactly once."""
        from django.contrib.auth.hashers import make_password

        plain = cls.generate_token()
        expira = timezone.now() + timedelta(
            minutes=ttl_minutes or cls.DEFAULT_TTL_MINUTES
        )
        instance = cls.objects.create(
            usuario=usuario,
            token_hash=make_password(plain),
            expira_em=expira,
        )
        return instance, plain
