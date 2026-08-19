"""Models for `submissoes`: Submissao, ChatDuvida and RelatorioCadastroMassa."""
from __future__ import annotations

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Submissao(models.Model):
    """A student's answer to a single exercise."""

    class Status(models.TextChoices):
        PENDENTE = "PENDENTE", "Pendente"
        EM_PROCESSAMENTO = "EM_PROCESSAMENTO", "Em processamento"
        CORRIGIDA = "CORRIGIDA", "Corrigida"
        REVISADA_PROFESSOR = "REVISADA_PROFESSOR", "Revisada pelo professor"
        CONFLITO_SYNC = "CONFLITO_SYNC", "Conflito de sincronização"

    aluno = models.ForeignKey(
        "accounts.Usuario",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "ALUNO"},
        related_name="submissoes",
    )
    exercicio = models.ForeignKey(
        "atividades.Exercicio",
        on_delete=models.CASCADE,
        related_name="submissoes",
    )
    resposta_texto = models.TextField(null=True, blank=True)
    pdf = models.FileField(upload_to="submissoes/", null=True, blank=True)
    nota_calculada = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    nota_professor_override = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    override_por = models.ForeignKey(
        "accounts.Usuario",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    categoria_erro_analytics = models.CharField(
        max_length=200, null=True, blank=True
    )
    feedback_ia = models.TextField(null=True, blank=True)
    feedback_professor = models.TextField(null=True, blank=True)
    status = models.CharField(
        max_length=25, choices=Status.choices, default=Status.PENDENTE
    )
    timestamp_local = models.DateTimeField(null=True, blank=True)
    server_time_snapshot = models.DateTimeField(null=True, blank=True)
    client_server_offset_ms = models.IntegerField(null=True, blank=True)
    atividade_updated_at_snapshot = models.DateTimeField(null=True, blank=True)
    observacao_resolucao = models.TextField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("aluno", "exercicio")
        indexes = [
            models.Index(fields=["aluno", "status"], name="idx_sub_aluno_status"),
            models.Index(fields=["exercicio", "status"], name="idx_sub_ex_status"),
            models.Index(
                fields=["categoria_erro_analytics"],
                name="idx_sub_cat_erro",
                condition=models.Q(categoria_erro_analytics__isnull=False),
            ),
        ]

    @property
    def nota_final(self) -> int | None:
        return (
            self.nota_professor_override
            if self.nota_professor_override is not None
            else self.nota_calculada
        )

    @property
    def feedback_final(self) -> str | None:
        return self.feedback_professor or self.feedback_ia

    def __str__(self) -> str:
        return f"sub {self.id} aluno={self.aluno_id} ex={self.exercicio_id}"


class ChatDuvida(models.Model):
    """Tutor chat thread tied to a single (corrected) submission."""

    LIMITE_MENSAGENS = 3

    submissao = models.OneToOneField(
        Submissao, on_delete=models.CASCADE, related_name="chat"
    )
    mensagens = models.JSONField(default=list)
    contador_mensagens_aluno = models.IntegerField(default=0)

    def __str__(self) -> str:
        return f"chat sub={self.submissao_id} count={self.contador_mensagens_aluno}"


class RelatorioCadastroMassa(models.Model):
    """Tracks the async PDF→students bulk-create job."""

    class Status(models.TextChoices):
        PROCESSANDO = "PROCESSANDO", "Processando"
        CONCLUIDO = "CONCLUIDO", "Concluído"
        ERRO = "ERRO", "Erro"

    turma = models.ForeignKey(
        "escolas.Turma",
        on_delete=models.CASCADE,
        related_name="relatorios_cadastro",
    )
    solicitado_por = models.ForeignKey(
        "accounts.Usuario", on_delete=models.CASCADE, related_name="+"
    )
    pdf_original = models.FileField(upload_to="cadastros_massa/")
    resultado = models.JSONField(null=True, blank=True)
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.PROCESSANDO
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]
        indexes = [models.Index(fields=["status"], name="idx_rel_cad_status")]

    def __str__(self) -> str:
        return f"relatorio #{self.id} turma={self.turma_id} status={self.status}"
