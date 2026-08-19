"""Models for `escolas`: Escola, Turma and ProfessorTurma pivot table."""
from __future__ import annotations

from django.db import models


class Escola(models.Model):
    nome = models.CharField(max_length=200)
    cnpj = models.CharField(max_length=18)
    criado_em = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("nome", "cnpj")
        ordering = ["nome"]

    def __str__(self) -> str:
        return f"{self.nome} ({self.cnpj})"


class Turma(models.Model):
    nome = models.CharField(max_length=100)
    escola = models.ForeignKey(
        Escola, on_delete=models.CASCADE, related_name="turmas"
    )
    ranking_pontuacao_ativo = models.BooleanField(default=False)
    ranking_provas_ativo = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("escola", "nome")
        ordering = ["escola_id", "nome"]

    def __str__(self) -> str:
        return f"{self.nome} — {self.escola.nome}"


class ProfessorTurma(models.Model):
    """Many-to-many pivot between professors and the classes they teach."""

    professor = models.ForeignKey(
        "accounts.Usuario",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "PROFESSOR"},
        related_name="vinculos_turma",
    )
    turma = models.ForeignKey(
        Turma, on_delete=models.CASCADE, related_name="vinculos_professor"
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("professor", "turma")
        indexes = [models.Index(fields=["turma"], name="idx_prof_turma_turma")]

    def __str__(self) -> str:
        return f"{self.professor_id} ↔ {self.turma_id}"
