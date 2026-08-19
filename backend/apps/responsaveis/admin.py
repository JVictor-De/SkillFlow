from django.contrib import admin

from .models import ResponsavelAluno


@admin.register(ResponsavelAluno)
class ResponsavelAlunoAdmin(admin.ModelAdmin):
    list_display = ("id", "responsavel", "aluno", "criado_em")
    search_fields = ("responsavel__email", "aluno__email")
