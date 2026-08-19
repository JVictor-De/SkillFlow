"""Bulk-create students from a PDF (Coordenador/Professor SaaS feature)."""
from __future__ import annotations

import logging
import re
from typing import Iterable

from celery import shared_task

from apps.accounts.models import Usuario
from apps.accounts.services import gerar_senha_provisoria
from apps.submissoes.models import RelatorioCadastroMassa
from services.llm_service import get_llm_service
from services.pdf_service import extrair_texto_pdf

logger = logging.getLogger("skillflow.tasks.cadastro_massa")
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")


@shared_task(name="tasks.cadastro_massa.cadastrar_alunos_massa_pdf")
def cadastrar_alunos_massa_pdf(relatorio_id: int) -> dict:
    relatorio = RelatorioCadastroMassa.objects.filter(id=relatorio_id).first()
    if relatorio is None:
        return {"criados": [], "falhas": [], "erro": "relatorio inexistente"}

    try:
        texto = extrair_texto_pdf(relatorio.pdf_original.path) if relatorio.pdf_original else ""
        llm = get_llm_service()
        candidatos = llm.estruturar_alunos_pdf(texto)
        criados, falhas = _criar_alunos(candidatos, turma=relatorio.turma)
        relatorio.resultado = {"criados": criados, "falhas": falhas}
        relatorio.status = RelatorioCadastroMassa.Status.CONCLUIDO
        relatorio.save(update_fields=["resultado", "status"])
        return relatorio.resultado
    except Exception as exc:  # pragma: no cover - we only test happy path
        logger.exception("Falha em cadastrar_alunos_massa_pdf")
        relatorio.status = RelatorioCadastroMassa.Status.ERRO
        relatorio.resultado = {"erro": str(exc)}
        relatorio.save(update_fields=["resultado", "status"])
        return relatorio.resultado


def _criar_alunos(candidatos: Iterable[dict], *, turma) -> tuple[list[dict], list[dict]]:
    criados: list[dict] = []
    falhas: list[dict] = []
    for entry in candidatos or []:
        nome = (entry.get("nome") or "").strip()
        email = (entry.get("email") or "").strip().lower()
        if not email or not EMAIL_RE.match(email):
            falhas.append({"nome": nome, "email": email, "motivo": "Email inválido."})
            continue
        if Usuario.objects.filter(email__iexact=email).exists():
            falhas.append({"nome": nome, "email": email, "motivo": "Email já cadastrado."})
            continue
        senha = gerar_senha_provisoria()
        first_name, _, last_name = nome.partition(" ")
        Usuario.objects.create_user(
            email=email,
            password=senha,
            username=email,
            first_name=first_name or email.split("@")[0],
            last_name=last_name,
            role=Usuario.Role.ALUNO,
            turma=turma,
            senha_provisoria=True,
        )
        criados.append({"nome": nome, "email": email, "senha": senha})
    return criados, falhas
