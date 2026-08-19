"""Cadastro em massa de alunos via PDF + IA (mock)."""
from __future__ import annotations

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.accounts.models import Usuario
from apps.submissoes.models import RelatorioCadastroMassa


def _fake_pdf_bytes(extra_text: str = "") -> bytes:
    """A minimal but valid-enough PDF that PyPDF2 can parse the header.

    PyPDF2 will sometimes refuse to extract text from this stub — the
    cadastro-massa task already has a fallback path; the LLM mock parses
    plain-text candidates from the extracted body, so the stream content
    matters less than the header.
    """
    return b"%PDF-1.4\n" + extra_text.encode("utf-8") + b"\n%%EOF"


@pytest.mark.django_db
def test_upload_pdf_enfileira_task_e_cria_relatorio(
    client, cenario, auth_headers, monkeypatch
):
    pdf = SimpleUploadedFile(
        "alunos.pdf",
        _fake_pdf_bytes("Maria - maria@test.com\nJoão - joao@test.com"),
        content_type="application/pdf",
    )

    # Inject fixed candidates into the mock LLM so we don't depend on PyPDF2 text extraction.
    from services import llm_service

    class _FakeLLM(llm_service.MockLLMService):
        def estruturar_alunos_pdf(self, texto):
            return [
                {"nome": "Maria Silva", "email": "maria@test.com"},
                {"nome": "João Souza", "email": "joao@test.com"},
                {"nome": "Inválido", "email": "isso não é email"},
            ]

    monkeypatch.setattr(llm_service, "get_llm_service", lambda: _FakeLLM())

    resp = client.post(
        f"/api/saas/turmas/{cenario['turma'].id}/alunos/cadastrar-massa/",
        data={"pdf": pdf},
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 202, resp.content
    rid = resp.json()["relatorio_id"]
    relatorio = RelatorioCadastroMassa.objects.get(id=rid)
    # Eager mode: task already finished.
    assert relatorio.status == RelatorioCadastroMassa.Status.CONCLUIDO
    criados = {c["email"] for c in relatorio.resultado["criados"]}
    falhas = {f["email"] for f in relatorio.resultado["falhas"]}
    assert "maria@test.com" in criados
    assert "joao@test.com" in criados
    assert any("isso não é email" in f for f in falhas)
    # And the alunos really exist.
    assert Usuario.objects.filter(
        email="maria@test.com", role=Usuario.Role.ALUNO,
        turma=cenario["turma"],
    ).exists()


@pytest.mark.django_db
def test_consultar_relatorio_retorna_status_e_resultado(
    client, cenario, auth_headers
):
    relatorio = RelatorioCadastroMassa.objects.create(
        turma=cenario["turma"],
        solicitado_por=cenario["professor"],
        pdf_original=SimpleUploadedFile("x.pdf", b"%PDF-1.4\n%%EOF"),
        status=RelatorioCadastroMassa.Status.CONCLUIDO,
        resultado={"criados": [], "falhas": []},
    )
    resp = client.get(
        f"/api/saas/relatorios-cadastro/{relatorio.id}/",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "CONCLUIDO"
