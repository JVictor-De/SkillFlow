"""Models for `atividades`: MaterialApoio, Atividade, Exercicio, NotaAtividadeAluno."""
from __future__ import annotations

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone


class MaterialApoio(models.Model):
    """Reusable PDF (apostila) used as RAG source for AI exercise generation."""

    titulo = models.CharField(max_length=200)
    arquivo = models.FileField(upload_to="materiais/")
    turma = models.ForeignKey(
        "escolas.Turma", on_delete=models.CASCADE, related_name="materiais"
    )
    enviado_por = models.ForeignKey(
        "accounts.Usuario", on_delete=models.CASCADE, related_name="materiais_enviados"
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]

    def __str__(self) -> str:
        return self.titulo


class Atividade(models.Model):
    """An exercise or test grouping N exercises."""

    class StatusPublicacao(models.TextChoices):
        DRAFT = "DRAFT", "Rascunho"
        AGENDADO = "AGENDADO", "Agendado"
        PUBLICADO = "PUBLICADO", "Publicado"

    class TipoAtividade(models.TextChoices):
        EXERCICIO = "EXERCICIO", "Exercício"
        PROVA = "PROVA", "Prova"

    titulo = models.CharField(max_length=200)
    disciplina = models.CharField(max_length=100)
    tipo_atividade = models.CharField(max_length=10, choices=TipoAtividade.choices)
    peso = models.PositiveIntegerField(null=True, blank=True)
    status_publicacao = models.CharField(
        max_length=15,
        choices=StatusPublicacao.choices,
        default=StatusPublicacao.DRAFT,
    )
    data_liberacao = models.DateTimeField(null=True, blank=True)
    data_limite = models.DateTimeField(null=True, blank=True)
    turma = models.ForeignKey(
        "escolas.Turma", on_delete=models.CASCADE, related_name="atividades"
    )
    criado_por = models.ForeignKey(
        "accounts.Usuario",
        on_delete=models.CASCADE,
        related_name="atividades_criadas",
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(
                fields=["turma", "status_publicacao", "data_liberacao"],
                name="idx_atv_turma_status_lib",
            ),
            models.Index(fields=["tipo_atividade"], name="idx_atv_tipo"),
        ]
        constraints = [
            models.CheckConstraint(
                check=(
                    Q(tipo_atividade="EXERCICIO", peso=1)
                    | Q(tipo_atividade="PROVA", peso__gte=1)
                ),
                name="atv_peso_consistente",
            ),
            models.CheckConstraint(
                check=(
                    Q(status_publicacao="DRAFT")
                    | (
                        Q(data_liberacao__isnull=False)
                        & Q(data_limite__isnull=False)
                    )
                ),
                name="atv_datas_consistentes",
            ),
        ]
        ordering = ["-criado_em"]

    def __str__(self) -> str:
        return f"{self.titulo} ({self.tipo_atividade})"

    # ------------------------------------------------------------- validation
    def clean(self):
        super().clean()
        if self.tipo_atividade == self.TipoAtividade.EXERCICIO:
            self.peso = 1
        elif self.tipo_atividade == self.TipoAtividade.PROVA:
            if self.peso is None or self.peso < 1:
                raise ValidationError(
                    {"peso": "Provas devem ter peso explícito >= 1."}
                )
        if self.status_publicacao != self.StatusPublicacao.DRAFT:
            if self.data_liberacao is None or self.data_limite is None:
                raise ValidationError(
                    "data_liberacao e data_limite são obrigatórios fora de DRAFT."
                )
            if self.data_limite <= self.data_liberacao:
                raise ValidationError(
                    "data_limite deve ser posterior a data_liberacao."
                )

    def save(self, *args, **kwargs):
        if self.tipo_atividade == self.TipoAtividade.EXERCICIO:
            self.peso = 1
        return super().save(*args, **kwargs)

    # --------------------------------------------------------------- numbers
    def calcular_nota_aluno(self, aluno) -> int | None:
        """Average grade of the activity for `aluno`.

        - Before deadline: simple average of *graded* questions only.
        - After deadline: missing/uncorrected questions count as 0 to avoid
          inflating the score.
        """
        exercicios = list(self.exercicios.all())
        if not exercicios:
            return None
        prazo_encerrado = (
            self.data_limite is not None and timezone.now() > self.data_limite
        )
        total = 0
        contadas = 0
        for exercicio in exercicios:
            submissao = exercicio.submissoes.filter(aluno=aluno).first()
            if submissao and submissao.nota_final is not None:
                total += submissao.nota_final
                contadas += 1
            elif prazo_encerrado:
                contadas += 1  # contributes as zero
        divisor = len(exercicios) if prazo_encerrado else contadas
        if divisor == 0:
            return None
        return round(total / divisor)

    @staticmethod
    def calcular_media_geral_aluno(aluno, turma) -> int | None:
        """Weighted average across all PUBLISHED activities of `turma`.

        Honours `NotaAtividadeAluno` overrides over the auto-calculated value.
        """
        atividades = Atividade.objects.filter(
            turma=turma,
            status_publicacao=Atividade.StatusPublicacao.PUBLICADO,
        )
        soma_ponderada = 0
        soma_pesos = 0
        for atv in atividades:
            override = NotaAtividadeAluno.objects.filter(
                aluno=aluno, atividade=atv
            ).first()
            nota = (
                override.nota_override
                if override
                else atv.calcular_nota_aluno(aluno)
            )
            if nota is not None:
                peso = atv.peso or 1
                soma_ponderada += nota * peso
                soma_pesos += peso
        if soma_pesos == 0:
            return None
        return round(soma_ponderada / soma_pesos)


class Exercicio(models.Model):
    """Individual question inside an Atividade.

    A SkillFlow `Atividade` supports three answer types:

    - ``MULTIPLA_ESCOLHA`` — student picks one alternative on the platform.
    - ``DISSERTATIVA_TEXTO`` — student types a free-text answer on the
      platform.
    - ``DISSERTATIVA`` — student attaches a PDF (legacy name kept for
      stored data compatibility; the UI calls it "Anexo (PDF)").
    """

    class Tipo(models.TextChoices):
        MULTIPLA_ESCOLHA = "MULTIPLA_ESCOLHA", "Múltipla escolha"
        DISSERTATIVA_TEXTO = "DISSERTATIVA_TEXTO", "Dissertativa (texto)"
        DISSERTATIVA = "DISSERTATIVA", "Anexo (PDF)"

    # Backwards-compat alias used across the codebase + tests where a
    # "free-text" question is intended (text answer typed on the platform).
    TIPOS_DISSERTATIVOS = ("DISSERTATIVA", "DISSERTATIVA_TEXTO")

    atividade = models.ForeignKey(
        Atividade, on_delete=models.CASCADE, related_name="exercicios"
    )
    ordem = models.PositiveIntegerField()
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    enunciado = models.TextField()
    gabarito_esperado = models.TextField()
    alternativas = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ["ordem"]
        unique_together = ("atividade", "ordem")
        indexes = [models.Index(fields=["atividade"], name="idx_ex_atividade")]
        constraints = [
            models.CheckConstraint(
                # Múltipla escolha exige alternativas; os dois tipos
                # dissertativos (texto e anexo) não podem ter alternativas.
                check=(
                    Q(tipo="MULTIPLA_ESCOLHA", alternativas__isnull=False)
                    | Q(tipo="DISSERTATIVA", alternativas__isnull=True)
                    | Q(
                        tipo="DISSERTATIVA_TEXTO",
                        alternativas__isnull=True,
                    )
                ),
                name="ex_alternativas_consistentes",
            )
        ]

    def __str__(self) -> str:
        return f"#{self.ordem} - {self.tipo} ({self.atividade_id})"

    @property
    def is_dissertativo(self) -> bool:
        """Either ``DISSERTATIVA`` (PDF) or ``DISSERTATIVA_TEXTO`` (text)."""
        return self.tipo in self.TIPOS_DISSERTATIVOS

    @property
    def exige_pdf(self) -> bool:
        return self.tipo == self.Tipo.DISSERTATIVA

    @property
    def exige_texto(self) -> bool:
        return self.tipo == self.Tipo.DISSERTATIVA_TEXTO

    def clean(self):
        super().clean()
        if self.tipo == self.Tipo.MULTIPLA_ESCOLHA and not self.alternativas:
            raise ValidationError(
                "Exercícios de múltipla escolha exigem alternativas."
            )
        if self.is_dissertativo and self.alternativas:
            raise ValidationError(
                "Exercícios dissertativos não devem ter alternativas."
            )


class NotaAtividadeAluno(models.Model):
    """Override of the consolidated activity grade for one student."""

    aluno = models.ForeignKey(
        "accounts.Usuario",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "ALUNO"},
        related_name="notas_consolidadas_override",
    )
    atividade = models.ForeignKey(
        Atividade, on_delete=models.CASCADE, related_name="notas_consolidadas_override"
    )
    nota_override = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    override_por = models.ForeignKey(
        "accounts.Usuario",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("aluno", "atividade")
        indexes = [
            models.Index(fields=["atividade"], name="idx_nota_atv_atv"),
        ]

    def __str__(self) -> str:
        return f"override {self.aluno_id} @ {self.atividade_id} = {self.nota_override}"
