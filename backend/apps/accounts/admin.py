from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import PasswordResetToken, Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ("id", "email", "first_name", "last_name", "role", "turma", "escola", "senha_provisoria")
    list_filter = ("role", "is_active", "senha_provisoria")
    search_fields = ("email", "first_name", "last_name")
    ordering = ("email",)
    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        ("Identificação", {"fields": ("first_name", "last_name", "role")}),
        ("Vínculos", {"fields": ("turma", "escola")}),
        ("Dispositivo", {"fields": ("fcm_device_token", "senha_provisoria")}),
        ("Permissões", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Datas", {"fields": ("last_login", "date_joined", "updated_at")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "username", "password1", "password2", "role", "turma", "escola"),
        }),
    )
    readonly_fields = ("updated_at",)


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ("id", "usuario", "expira_em", "usado_em", "criado_em")
    list_filter = ("usado_em",)
    search_fields = ("usuario__email",)
    readonly_fields = ("token_hash", "criado_em")
