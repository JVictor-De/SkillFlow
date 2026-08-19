"""Submissão pipelines: MC sync, dissertativa async, prazos, conflito."""
from __future__ import annotations

from datetime import timedelta
from urllib.parse import urlparse

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from apps.atividades.models import Atividade, Exercicio
from apps.submissoes.models import Submissao


def _post_submissao(client, headers, **kwargs):
    return client.post("/api/app/submissoes/", **kwargs, **headers)


@pytest.mark.django_db
def test_submissao_mc_corrige_sincronamente_acerto(
    client, cenario, auth_headers, make_atividade
):
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    ex = atv.exercicios.get(ordem=1)
    resp = client.post(
        "/api/app/submissoes/",
        data={"exercicio_id": ex.id, "resposta_texto": "C"},
        **auth_headers(cenario["aluno"]),
    )
    assert resp.status_code == 201, resp.content
    body = resp.json()
    assert body["status"] == Submissao.Status.CORRIGIDA
    assert body["nota_calculada"] == 100
    assert body["correto"] is True


@pytest.mark.django_db
def test_submissao_mc_corrige_sincronamente_erro(
    client, cenario, auth_headers, make_atividade
):
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    ex = atv.exercicios.get(ordem=1)
    resp = client.post(
        "/api/app/submissoes/",
        data={"exercicio_id": ex.id, "resposta_texto": "A"},
        **auth_headers(cenario["aluno"]),
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["nota_calculada"] == 0
    assert body["correto"] is False


@pytest.mark.django_db
def test_submissao_dissertativa_cria_pendente_e_corrige_em_eager(
    client, cenario, auth_headers, make_atividade
):
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    ex = atv.exercicios.get(ordem=2)
    pdf = SimpleUploadedFile(
        "resp.pdf", b"%PDF-1.4\n%fake\n%%EOF", content_type="application/pdf"
    )
    resp = client.post(
        "/api/app/submissoes/",
        data={"exercicio_id": ex.id, "pdf": pdf},
        **auth_headers(cenario["aluno"]),
    )
    assert resp.status_code == 201, resp.content
    sub = Submissao.objects.get(aluno=cenario["aluno"], exercicio=ex)
    # Eager mode → CORRIGIDA after the worker call.
    assert sub.status == Submissao.Status.CORRIGIDA
    assert sub.nota_calculada is not None


@pytest.mark.django_db
def test_submissao_apos_data_limite_online_retorna_400(
    client, cenario, auth_headers, make_atividade
):
    agora = timezone.now()
    atv = make_atividade(
        turma=cenario["turma"],
        criado_por=cenario["professor"],
        data_liberacao=agora - timedelta(days=5),
        data_limite=agora - timedelta(days=1),
    )
    ex = atv.exercicios.get(ordem=1)
    resp = client.post(
        "/api/app/submissoes/",
        data={"exercicio_id": ex.id, "resposta_texto": "C"},
        **auth_headers(cenario["aluno"]),
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_submissao_offline_dentro_prazo_com_metadados_validos_aceita(
    client, cenario, auth_headers, make_atividade
):
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    ex = atv.exercicios.get(ordem=1)
    timestamp_local = (timezone.now() - timedelta(minutes=10)).isoformat()
    resp = client.post(
        "/api/app/submissoes/",
        data={
            "exercicio_id": ex.id,
            "resposta_texto": "C",
            "timestamp_local": timestamp_local,
            "client_server_offset_ms": 0,
            "server_time_snapshot": timezone.now().isoformat(),
            "atividade_updated_at_snapshot": atv.updated_at.isoformat(),
        },
        **auth_headers(cenario["aluno"]),
    )
    assert resp.status_code == 201, resp.content
    body = resp.json()
    assert body["status"] == Submissao.Status.CORRIGIDA


@pytest.mark.django_db
def test_submissao_offline_offset_incoerente_cria_conflito_sync(
    client, cenario, auth_headers, make_atividade
):
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    ex = atv.exercicios.get(ordem=1)
    timestamp_local = (timezone.now() - timedelta(minutes=5)).isoformat()
    resp = client.post(
        "/api/app/submissoes/",
        data={
            "exercicio_id": ex.id,
            "resposta_texto": "C",
            "timestamp_local": timestamp_local,
            # Offset of 48h — clearly out of bounds.
            "client_server_offset_ms": 48 * 3600 * 1000,
            "atividade_updated_at_snapshot": atv.updated_at.isoformat(),
        },
        **auth_headers(cenario["aluno"]),
    )
    assert resp.status_code == 201
    assert resp.json()["status"] == Submissao.Status.CONFLITO_SYNC


@pytest.mark.django_db
def test_submissao_duplicada_mesmo_exercicio_retorna_409(
    client, cenario, auth_headers, make_atividade
):
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    ex = atv.exercicios.get(ordem=1)
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=ex, resposta_texto="C",
        nota_calculada=100, status=Submissao.Status.CORRIGIDA,
    )
    resp = client.post(
        "/api/app/submissoes/",
        data={"exercicio_id": ex.id, "resposta_texto": "A"},
        **auth_headers(cenario["aluno"]),
    )
    assert resp.status_code == 409


@pytest.mark.django_db
def test_override_nota_grava_override_por_id_e_status(
    client, cenario, auth_headers, make_atividade
):
    import json

    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    ex = atv.exercicios.get(ordem=1)
    sub = Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=ex, resposta_texto="A",
        nota_calculada=0, status=Submissao.Status.CORRIGIDA,
    )
    resp = client.put(
        f"/api/saas/submissoes/{sub.id}/override-nota/",
        data=json.dumps({"nota": 80, "feedback": "Reavaliação"}),
        content_type="application/json",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 200, resp.content
    sub.refresh_from_db()
    assert sub.nota_professor_override == 80
    assert sub.feedback_professor == "Reavaliação"
    assert sub.status == Submissao.Status.REVISADA_PROFESSOR
    assert sub.override_por_id == cenario["professor"].id


@pytest.mark.django_db
def test_nota_final_retorna_override_quando_existe(make_atividade, cenario):
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    ex = atv.exercicios.get(ordem=1)
    sub = Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=ex, resposta_texto="C",
        nota_calculada=100, nota_professor_override=70,
        status=Submissao.Status.REVISADA_PROFESSOR,
    )
    assert sub.nota_final == 70


@pytest.mark.django_db
def test_detalhe_submissao_dispara_correcao_ia_para_dissertativa_pendente(
    client, cenario, auth_headers, make_atividade
):
    """Regression: dissertativa que ficou em PENDENTE (worker offline na
    hora do envio) deve ser ressuscitada quando um docente abre o
    detalhe — eliminando o "Sem feedback automático ainda" perpétuo."""
    from django.core.files.uploadedfile import SimpleUploadedFile

    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    ex = atv.exercicios.get(ordem=2)
    pdf = SimpleUploadedFile(
        "resp.pdf", b"%PDF-1.4\n%fake\n%%EOF", content_type="application/pdf"
    )
    sub = Submissao.objects.create(
        aluno=cenario["aluno"],
        exercicio=ex,
        pdf=pdf,
        status=Submissao.Status.PENDENTE,
    )
    resp = client.get(
        f"/api/saas/submissoes/{sub.id}/",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 200, resp.content
    body = resp.json()
    # CELERY_TASK_ALWAYS_EAGER=True → task executa síncrona,
    # o status cai para CORRIGIDA e feedback_ia é preenchido.
    assert body["status"] == Submissao.Status.CORRIGIDA
    assert body["feedback_ia"]


@pytest.mark.django_db
def test_submissao_dissertativa_texto_aceita_apenas_texto(
    client, cenario, auth_headers, make_atividade
):
    """O novo tipo `DISSERTATIVA_TEXTO` aceita resposta digitada no app
    (sem PDF) e dispara o pipeline assíncrono de correção. Regressão do
    cenário onde só existiam 2 tipos: múltipla e anexo PDF."""
    atv = make_atividade(
        turma=cenario["turma"],
        criado_por=cenario["professor"],
        com_exercicios=False,
    )
    ex = Exercicio.objects.create(
        atividade=atv,
        ordem=1,
        tipo=Exercicio.Tipo.DISSERTATIVA_TEXTO,
        enunciado="Resuma o capítulo 3.",
        gabarito_esperado="O capítulo aborda economia e política.",
    )
    resp = client.post(
        "/api/app/submissoes/",
        data={
            "exercicio_id": ex.id,
            "resposta_texto": "Aborda economia e política do período colonial.",
        },
        **auth_headers(cenario["aluno"]),
    )
    assert resp.status_code == 201, resp.content
    sub = Submissao.objects.get(aluno=cenario["aluno"], exercicio=ex)
    # Eager mode → corrigida pelo worker depois do envio síncrono.
    assert sub.status == Submissao.Status.CORRIGIDA
    assert sub.resposta_texto


@pytest.mark.django_db
def test_submissao_dissertativa_texto_sem_resposta_retorna_400(
    client, cenario, auth_headers, make_atividade
):
    atv = make_atividade(
        turma=cenario["turma"],
        criado_por=cenario["professor"],
        com_exercicios=False,
    )
    ex = Exercicio.objects.create(
        atividade=atv,
        ordem=1,
        tipo=Exercicio.Tipo.DISSERTATIVA_TEXTO,
        enunciado="Resuma o capítulo 3.",
        gabarito_esperado="...",
    )
    resp = client.post(
        "/api/app/submissoes/",
        data={"exercicio_id": ex.id},
        **auth_headers(cenario["aluno"]),
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_detalhe_submissao_retorna_pdf_url_absoluta_e_servivel(
    client, cenario, auth_headers, make_atividade, settings
):
    """Regressão Bug 4 — "PDF abrindo 404".

    O detalhe da submissão deve devolver ``pdf_url`` como URL **absoluta**
    (``http(s)://host/media/...``) para que o frontend consiga abrir o
    arquivo direto em ``<a target="_blank">`` mesmo quando API e SPA
    vivem em origens diferentes (api.skillflow vs app.skillflow). Além
    disso, o caminho `/media/` precisa ser servido por Django também
    fora de DEBUG — caso contrário caía em 404 mesmo com a URL correta.
    """
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    ex = atv.exercicios.get(ordem=2)
    pdf = SimpleUploadedFile(
        "resp.pdf", b"%PDF-1.4\n%fake\n%%EOF", content_type="application/pdf"
    )
    sub = Submissao.objects.create(
        aluno=cenario["aluno"],
        exercicio=ex,
        pdf=pdf,
        status=Submissao.Status.CORRIGIDA,
        nota_calculada=80,
    )
    resp = client.get(
        f"/api/saas/submissoes/{sub.id}/",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 200, resp.content
    body = resp.json()
    pdf_url = body["pdf_url"]
    assert pdf_url, "pdf_url não pode ficar vazio quando há PDF anexado."
    assert pdf_url.startswith(("http://", "https://")), (
        f"Esperava URL absoluta para o PDF (Bug 4), recebi: {pdf_url!r}"
    )
    assert "/media/submissoes/" in pdf_url

    # 2) O caminho de `/media/` tem de ser servível também com DEBUG=False.
    # Em produção Django serve `/media/` via URL pattern dedicado (ver
    # config/urls.py); este teste blinda contra regressão de alguém remover
    # o re_path acreditando que `static()` resolve em produção.
    settings.DEBUG = False
    media_path = urlparse(pdf_url).path
    download = client.get(media_path)
    assert download.status_code == 200, (
        "Servidor não devolveu o PDF em /media/ — fix do Bug 4 regrediu."
    )


@pytest.mark.django_db
def test_submissao_dissertativa_texto_nao_aceita_pdf(
    client, cenario, auth_headers, make_atividade
):
    """Se o tipo é `DISSERTATIVA_TEXTO`, anexo PDF é inválido — é
    confusão de cliente e o backend nega para evitar dois caminhos
    diferentes de correção sobre o mesmo exercício."""
    atv = make_atividade(
        turma=cenario["turma"],
        criado_por=cenario["professor"],
        com_exercicios=False,
    )
    ex = Exercicio.objects.create(
        atividade=atv,
        ordem=1,
        tipo=Exercicio.Tipo.DISSERTATIVA_TEXTO,
        enunciado="Resuma.",
        gabarito_esperado="...",
    )
    pdf = SimpleUploadedFile(
        "resp.pdf", b"%PDF-1.4\n%fake\n%%EOF", content_type="application/pdf"
    )
    resp = client.post(
        "/api/app/submissoes/",
        data={
            "exercicio_id": ex.id,
            "resposta_texto": "Texto",
            "pdf": pdf,
        },
        **auth_headers(cenario["aluno"]),
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_calculo_nota_atividade_proporcional_correto(
    cenario, make_atividade
):
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=atv.exercicios.get(ordem=1),
        resposta_texto="C", nota_calculada=100, status=Submissao.Status.CORRIGIDA,
    )
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=atv.exercicios.get(ordem=2),
        resposta_texto="...", nota_calculada=50, status=Submissao.Status.CORRIGIDA,
    )
    # (100 + 50) / 2 = 75
    assert atv.calcular_nota_aluno(cenario["aluno"]) == 75
