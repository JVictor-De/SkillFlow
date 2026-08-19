from django.contrib import admin

from .models import ChatDuvida, RelatorioCadastroMassa, Submissao


@admin.register(Submissao)
class SubmissaoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "aluno",
        "exercicio",
        "status",
        "nota_calculada",
        "nota_professor_override",
        "criado_em",
    )
    list_filter = ("status",)
    search_fields = ("aluno__email", "exercicio__atividade__titulo")


@admin.register(ChatDuvida)
class ChatDuvidaAdmin(admin.ModelAdmin):
    list_display = ("id", "submissao", "contador_mensagens_aluno")


@admin.register(RelatorioCadastroMassa)
class RelatorioCadastroMassaAdmin(admin.ModelAdmin):
    list_display = ("id", "turma", "solicitado_por", "status", "criado_em")
    list_filter = ("status",)
