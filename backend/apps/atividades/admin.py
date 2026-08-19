from django.contrib import admin

from .models import Atividade, Exercicio, MaterialApoio, NotaAtividadeAluno


class ExercicioInline(admin.TabularInline):
    model = Exercicio
    extra = 0
    fields = ("ordem", "tipo", "enunciado", "gabarito_esperado", "alternativas")


@admin.register(Atividade)
class AtividadeAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "titulo",
        "tipo_atividade",
        "peso",
        "status_publicacao",
        "turma",
        "criado_por",
        "data_liberacao",
        "data_limite",
    )
    list_filter = ("tipo_atividade", "status_publicacao", "turma__escola", "disciplina")
    search_fields = ("titulo", "disciplina")
    inlines = [ExercicioInline]


@admin.register(Exercicio)
class ExercicioAdmin(admin.ModelAdmin):
    list_display = ("id", "atividade", "ordem", "tipo")
    list_filter = ("tipo",)
    search_fields = ("enunciado", "atividade__titulo")


@admin.register(MaterialApoio)
class MaterialApoioAdmin(admin.ModelAdmin):
    list_display = ("id", "titulo", "turma", "enviado_por", "criado_em")
    search_fields = ("titulo", "turma__nome")


@admin.register(NotaAtividadeAluno)
class NotaAtividadeAlunoAdmin(admin.ModelAdmin):
    list_display = ("id", "aluno", "atividade", "nota_override", "override_por", "atualizado_em")
    search_fields = ("aluno__email", "atividade__titulo")
