"""Atividades creation/edition/listing tests."""
from __future__ import annotations

import json
from datetime import timedelta

import pytest
from django.utils import timezone

from apps.atividades.models import Atividade


@pytest.mark.django_db
def test_criar_atividade_exercicio_com_peso_padrao_1(client, cenario, auth_headers):
    payload = {
        "titulo": "L1",
        "disciplina": "Matemática",
        "tipo_atividade": "EXERCICIO",
        "turma_id": cenario["turma"].id,
        "exercicios": [],
    }
    resp = client.post(
        "/api/saas/atividades/",
        data=json.dumps(payload),
        content_type="application/json",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 201, resp.content
    body = resp.json()
    assert body["peso"] == 1


@pytest.mark.django_db
def test_criar_atividade_prova_com_peso_definido(client, cenario, auth_headers):
    payload = {
        "titulo": "P1",
        "disciplina": "Matemática",
        "tipo_atividade": "PROVA",
        "peso": 4,
        "turma_id": cenario["turma"].id,
        "exercicios": [],
    }
    resp = client.post(
        "/api/saas/atividades/",
        data=json.dumps(payload),
        content_type="application/json",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 201, resp.content
    assert resp.json()["peso"] == 4


@pytest.mark.django_db
def test_criar_atividade_prova_sem_peso_retorna_400(client, cenario, auth_headers):
    payload = {
        "titulo": "P sem peso",
        "disciplina": "Matemática",
        "tipo_atividade": "PROVA",
        "turma_id": cenario["turma"].id,
        "exercicios": [],
    }
    resp = client.post(
        "/api/saas/atividades/",
        data=json.dumps(payload),
        content_type="application/json",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_criar_atividade_sem_pertencimento_retorna_403(
    client, cenario, auth_headers
):
    payload = {
        "titulo": "X",
        "disciplina": "Mat",
        "tipo_atividade": "EXERCICIO",
        "turma_id": cenario["turma_outra"].id,
        "exercicios": [],
    }
    resp = client.post(
        "/api/saas/atividades/",
        data=json.dumps(payload),
        content_type="application/json",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_aprovar_draft_muda_status_para_publicado(
    client, cenario, auth_headers, make_atividade
):
    atv = make_atividade(
        turma=cenario["turma"],
        criado_por=cenario["professor"],
        status=Atividade.StatusPublicacao.DRAFT,
        com_exercicios=False,
        data_liberacao=None,
        data_limite=None,
    )
    payload = {
        "status_publicacao": "PUBLICADO",
        "data_liberacao": (timezone.now() - timedelta(hours=1)).isoformat(),
        "data_limite": (timezone.now() + timedelta(days=2)).isoformat(),
    }
    resp = client.put(
        f"/api/saas/atividades/{atv.id}/aprovar-agendar/",
        data=json.dumps(payload),
        content_type="application/json",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 200, resp.content
    atv.refresh_from_db()
    assert atv.status_publicacao == Atividade.StatusPublicacao.PUBLICADO


@pytest.mark.django_db
def test_aprovar_com_data_liberacao_futura_muda_para_agendado(
    client, cenario, auth_headers, make_atividade
):
    atv = make_atividade(
        turma=cenario["turma"],
        criado_por=cenario["professor"],
        status=Atividade.StatusPublicacao.DRAFT,
        com_exercicios=False,
        data_liberacao=None,
        data_limite=None,
    )
    payload = {
        "status_publicacao": "AGENDADO",
        "data_liberacao": (timezone.now() + timedelta(days=1)).isoformat(),
        "data_limite": (timezone.now() + timedelta(days=4)).isoformat(),
    }
    resp = client.put(
        f"/api/saas/atividades/{atv.id}/aprovar-agendar/",
        data=json.dumps(payload),
        content_type="application/json",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 200, resp.content
    atv.refresh_from_db()
    assert atv.status_publicacao == Atividade.StatusPublicacao.AGENDADO


@pytest.mark.django_db
def test_listar_atividades_professor_ve_so_suas_turmas(
    client, cenario, auth_headers, make_atividade
):
    make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    make_atividade(
        turma=cenario["turma_outra"], criado_por=cenario["coordenador_outra"],
        status=Atividade.StatusPublicacao.PUBLICADO,
    )
    resp = client.get(
        "/api/saas/atividades/", **auth_headers(cenario["professor"])
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["count"] == 1


@pytest.mark.django_db
def test_listar_atividades_filtro_por_tipo(
    client, cenario, auth_headers, make_atividade
):
    make_atividade(turma=cenario["turma"], criado_por=cenario["professor"], tipo="EXERCICIO")
    make_atividade(
        turma=cenario["turma"], criado_por=cenario["professor"], tipo="PROVA", peso=2
    )
    resp = client.get(
        "/api/saas/atividades/?tipo=PROVA",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["count"] == 1
    assert body["results"][0]["tipo_atividade"] == "PROVA"


@pytest.mark.django_db
def test_coordenador_ve_atividades_de_todas_turmas_da_escola(
    client, cenario, auth_headers, make_atividade
):
    make_atividade(turma=cenario["turma"], criado_por=cenario["coordenador"])
    resp = client.get(
        "/api/saas/atividades/", **auth_headers(cenario["coordenador"])
    )
    assert resp.status_code == 200
    assert resp.json()["count"] >= 1


@pytest.mark.django_db
def test_excluir_publicada_com_submissoes_retorna_409(
    client, cenario, auth_headers, make_atividade
):
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    from apps.submissoes.models import Submissao

    Submissao.objects.create(
        aluno=cenario["aluno"],
        exercicio=atv.exercicios.first(),
        resposta_texto="C",
        nota_calculada=100,
        status=Submissao.Status.CORRIGIDA,
    )
    resp = client.delete(
        f"/api/saas/atividades/{atv.id}/",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 409


@pytest.mark.django_db
def test_excluir_publicada_force_apaga_submissoes_em_cascata(
    client, cenario, auth_headers, make_atividade
):
    """O frontend usa `?force=true` quando o professor confirma a
    exclusão de uma prova com respostas — o cascade do Django apaga
    exercícios e submissões em sequência."""
    from apps.submissoes.models import Submissao

    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    Submissao.objects.create(
        aluno=cenario["aluno"],
        exercicio=atv.exercicios.first(),
        resposta_texto="C",
        nota_calculada=100,
        status=Submissao.Status.CORRIGIDA,
    )
    resp = client.delete(
        f"/api/saas/atividades/{atv.id}/?force=true",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 200, resp.content
    assert not Atividade.objects.filter(id=atv.id).exists()


@pytest.mark.django_db
def test_fechar_atividade_antecipa_data_limite_e_recusa_submissoes(
    client, cenario, auth_headers, make_atividade
):
    """Fluxo "Fechar prova": após o PUT, novas submissões online retornam
    400 (prazo expirado) sem precisar tocar no estado da atividade na
    UI — o backend usa `data_limite` como gatilho."""
    agora = timezone.now()
    atv = make_atividade(
        turma=cenario["turma"],
        criado_por=cenario["professor"],
        data_liberacao=agora - timedelta(days=1),
        data_limite=agora + timedelta(days=5),
    )
    resp = client.put(
        f"/api/saas/atividades/{atv.id}/fechar/",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 200, resp.content
    body = resp.json()
    assert body["status_publicacao"] == "PUBLICADO"
    atv.refresh_from_db()
    # data_limite passa para "agora" → submissão online bate em prazo.
    ex = atv.exercicios.get(ordem=1)
    resp2 = client.post(
        "/api/app/submissoes/",
        data={"exercicio_id": ex.id, "resposta_texto": "C"},
        **auth_headers(cenario["aluno"]),
    )
    assert resp2.status_code == 400


@pytest.mark.django_db
def test_fechar_atividade_em_draft_retorna_400(
    client, cenario, auth_headers, make_atividade
):
    atv = make_atividade(
        turma=cenario["turma"],
        criado_por=cenario["professor"],
        status=Atividade.StatusPublicacao.DRAFT,
        com_exercicios=False,
        data_liberacao=None,
        data_limite=None,
    )
    resp = client.put(
        f"/api/saas/atividades/{atv.id}/fechar/",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_criar_atividade_com_3_tipos_de_exercicio(
    client, cenario, auth_headers
):
    """Criação aceita os 3 tipos descritos no PRD: múltipla escolha,
    dissertativa em texto e dissertativa por anexo (PDF). Exercícios
    persistem com a enum esperada pelo cliente (frontend e mobile)."""
    payload = {
        "titulo": "Atividade tri-tipos",
        "disciplina": "Geografia",
        "tipo_atividade": "EXERCICIO",
        "turma_id": cenario["turma"].id,
        "exercicios": [
            {
                "ordem": 1,
                "tipo": "MULTIPLA_ESCOLHA",
                "enunciado": "Capital do Brasil?",
                "gabarito_esperado": "B",
                "alternativas": {
                    "A": "São Paulo",
                    "B": "Brasília",
                    "C": "Rio de Janeiro",
                    "D": "Belo Horizonte",
                    "E": "Curitiba",
                },
            },
            {
                "ordem": 2,
                "tipo": "DISSERTATIVA_TEXTO",
                "enunciado": "Explique o conceito de bioma.",
                "gabarito_esperado": "Conjunto de ecossistemas similares.",
                "alternativas": None,
            },
            {
                "ordem": 3,
                "tipo": "DISSERTATIVA",
                "enunciado": "Anexe um mapa em PDF do bioma escolhido.",
                "gabarito_esperado": "Mapa coerente.",
                "alternativas": None,
            },
        ],
    }
    resp = client.post(
        "/api/saas/atividades/",
        data=json.dumps(payload),
        content_type="application/json",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 201, resp.content
    body = resp.json()
    tipos = sorted(e["tipo"] for e in body["exercicios"])
    assert tipos == ["DISSERTATIVA", "DISSERTATIVA_TEXTO", "MULTIPLA_ESCOLHA"]


@pytest.mark.django_db
def test_upload_material_pdf_aparece_na_listagem(
    client, cenario, auth_headers
):
    """Bug 2 do briefing: agora a UI tem botão "Adicionar material" que
    bate em `POST /api/saas/turmas/{id}/materiais/`. O backend persiste,
    a listagem retorna paginada e o material aparece imediatamente."""
    from django.core.files.uploadedfile import SimpleUploadedFile

    pdf_bytes = b"%PDF-1.4\nfake material\n%%EOF"
    pdf = SimpleUploadedFile(
        "apostila.pdf", pdf_bytes, content_type="application/pdf"
    )
    resp = client.post(
        f"/api/saas/turmas/{cenario['turma'].id}/materiais/?titulo=Apostila%20Teste",
        data={"arquivo": pdf},
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 201, resp.content
    body = resp.json()
    assert body["titulo"] == "Apostila Teste"

    listagem = client.get(
        f"/api/saas/turmas/{cenario['turma'].id}/materiais/",
        **auth_headers(cenario["professor"]),
    )
    assert listagem.status_code == 200
    titulos = [m["titulo"] for m in listagem.json()["results"]]
    assert "Apostila Teste" in titulos


@pytest.mark.django_db
def test_upload_material_em_turma_alheia_retorna_403(
    client, cenario, auth_headers
):
    from django.core.files.uploadedfile import SimpleUploadedFile

    pdf = SimpleUploadedFile(
        "x.pdf", b"%PDF-1.4\n%%EOF", content_type="application/pdf"
    )
    resp = client.post(
        f"/api/saas/turmas/{cenario['turma_outra'].id}/materiais/?titulo=X",
        data={"arquivo": pdf},
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_gerar_ia_enfileira_task_e_cria_draft(
    client, cenario, auth_headers
):
    from apps.atividades.models import MaterialApoio
    from django.core.files.uploadedfile import SimpleUploadedFile

    pdf_bytes = b"%PDF-1.4\n%fake\n%%EOF"
    material = MaterialApoio.objects.create(
        titulo="Apostila",
        arquivo=SimpleUploadedFile("apostila.pdf", pdf_bytes),
        turma=cenario["turma"],
        enviado_por=cenario["professor"],
    )
    payload = {
        "turma_id": cenario["turma"].id,
        "material_id": material.id,
        "quantidade": 2,
        "titulo": "AI Activity",
        "disciplina": "Matemática",
        "tipo_atividade": "EXERCICIO",
    }
    resp = client.post(
        "/api/saas/atividades/gerar-ia/",
        data=json.dumps(payload),
        content_type="application/json",
        **auth_headers(cenario["professor"]),
    )
    assert resp.status_code == 202, resp.content
    atv = Atividade.objects.get(id=resp.json()["atividade_id"])
    assert atv.status_publicacao == Atividade.StatusPublicacao.DRAFT
    # With CELERY_TASK_ALWAYS_EAGER, exercises are created right away.
    assert atv.exercicios.count() >= 1
