"""Models for `responsaveis`: parent ↔ student M:N pivot."""
from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import models


class ResponsavelAluno(models.Model):
    """Pivot bound by Coordenador only.

    Validation rules:
    - `responsavel.role == RESPONSAVEL`
    - `aluno.role == ALUNO`
    - both must belong to the same Escola (responsavel.escola == aluno.turma.escola)
    """

    responsavel = models.ForeignKey(
        "accounts.Usuario",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "RESPONSAVEL"},
        related_name="filhos_vinculados",
    )
    aluno = models.ForeignKey(
        "accounts.Usuario",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "ALUNO"},
        related_name="responsaveis_vinculados",
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("responsavel", "aluno")
        indexes = [
            models.Index(fields=["aluno"], name="idx_resp_alu_aluno"),
            models.Index(fields=["responsavel"], name="idx_resp_alu_resp"),
        ]

    def clean(self):
        super().clean()
        if self.responsavel_id == self.aluno_id:
            raise ValidationError("Responsável e aluno não podem ser o mesmo usuário.")
        escola_aluno_id = (
            self.aluno.turma.escola_id
            if self.aluno_id and self.aluno.turma_id
            else None
        )
        if self.responsavel.escola_id != escola_aluno_id:
            raise ValidationError(
                "Responsável e aluno devem pertencer à mesma escola."
            )

    def __str__(self) -> str:
        return f"{self.responsavel_id} → {self.aluno_id}"
