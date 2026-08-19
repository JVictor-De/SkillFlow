from django.contrib import admin

from .models import Escola, ProfessorTurma, Turma


class ProfessorTurmaInline(admin.TabularInline):
    model = ProfessorTurma
    extra = 0
    autocomplete_fields = ("professor",)


@admin.register(Escola)
class EscolaAdmin(admin.ModelAdmin):
    list_display = ("id", "nome", "cnpj", "criado_em")
    search_fields = ("nome", "cnpj")


@admin.register(Turma)
class TurmaAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "nome",
        "escola",
        "ranking_pontuacao_ativo",
        "ranking_provas_ativo",
        "criado_em",
    )
    list_filter = ("escola", "ranking_pontuacao_ativo", "ranking_provas_ativo")
    search_fields = ("nome", "escola__nome")
    inlines = [ProfessorTurmaInline]


@admin.register(ProfessorTurma)
class ProfessorTurmaAdmin(admin.ModelAdmin):
    list_display = ("id", "professor", "turma", "criado_em")
    autocomplete_fields = ("professor", "turma")
