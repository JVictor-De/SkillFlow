"""Model-level invariants (clean(), unique constraints, computed fields)."""
from __future__ import annotations

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.accounts.models import Usuario
from apps.atividades.models import Atividade, Exercicio, NotaAtividadeAluno
from apps.responsaveis.models import ResponsavelAluno
from apps.submissoes.models import Submissao


@pytest.mark.django_db
def test_usuario_aluno_sem_turma_valida_erro(make_user):
    user = Usuario(
        email="x@test.com", username="x@test.com", role=Usuario.Role.ALUNO
    )
    with pytest.raises(ValidationError):
        user.full_clean(exclude=["password"])


@pytest.mark.django_db
def test_usuario_professor_com_turma_valida_erro(cenario):
    pr = Usuario(
        email="prx@test.com",
        username="prx@test.com",
        role=Usuario.Role.PROFESSOR,
        turma=cenario["turma"],
    )
    with pytest.raises(ValidationError):
        pr.full_clean(exclude=["password"])


@pytest.mark.django_db
def test_submissao_unique_together_aluno_exercicio(cenario, make_atividade):
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    ex = atv.exercicios.get(ordem=1)
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=ex, resposta_texto="C",
        nota_calculada=100, status=Submissao.Status.CORRIGIDA,
    )
    with pytest.raises(IntegrityError):
        Submissao.objects.create(
            aluno=cenario["aluno"], exercicio=ex, resposta_texto="A",
            nota_calculada=0, status=Submissao.Status.CORRIGIDA,
        )


@pytest.mark.django_db
def test_atividade_exercicio_peso_sempre_1(cenario):
    atv = Atividade.objects.create(
        titulo="X",
        disciplina="Mat",
        tipo_atividade=Atividade.TipoAtividade.EXERCICIO,
        peso=8,  # try to override; save() must clamp to 1
        status_publicacao=Atividade.StatusPublicacao.DRAFT,
        turma=cenario["turma"],
        criado_por=cenario["professor"],
    )
    assert atv.peso == 1


@pytest.mark.django_db
def test_atividade_prova_peso_obrigatorio(cenario):
    atv = Atividade(
        titulo="P",
        disciplina="Mat",
        tipo_atividade=Atividade.TipoAtividade.PROVA,
        peso=None,
        status_publicacao=Atividade.StatusPublicacao.DRAFT,
        turma=cenario["turma"],
        criado_por=cenario["professor"],
    )
    with pytest.raises(ValidationError):
        atv.full_clean()


@pytest.mark.django_db
def test_atividade_calcular_media_geral_ponderada(cenario, make_atividade):
    ex_atv = make_atividade(
        turma=cenario["turma"], criado_por=cenario["professor"],
        tipo=Atividade.TipoAtividade.EXERCICIO,
    )
    prova = make_atividade(
        turma=cenario["turma"], criado_por=cenario["professor"],
        tipo=Atividade.TipoAtividade.PROVA, peso=3,
    )
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=ex_atv.exercicios.get(ordem=1),
        resposta_texto="C", nota_calculada=80, status=Submissao.Status.CORRIGIDA,
    )
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=ex_atv.exercicios.get(ordem=2),
        resposta_texto="x", nota_calculada=80, status=Submissao.Status.CORRIGIDA,
    )
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=prova.exercicios.get(ordem=1),
        resposta_texto="C", nota_calculada=60, status=Submissao.Status.CORRIGIDA,
    )
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=prova.exercicios.get(ordem=2),
        resposta_texto="y", nota_calculada=60, status=Submissao.Status.CORRIGIDA,
    )
    media = Atividade.calcular_media_geral_aluno(cenario["aluno"], cenario["turma"])
    assert media == 65


@pytest.mark.django_db
def test_atividade_calcular_nota_com_override_consolidado(
    cenario, make_atividade
):
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"])
    Submissao.objects.create(
        aluno=cenario["aluno"], exercicio=atv.exercicios.get(ordem=1),
        resposta_texto="A", nota_calculada=0, status=Submissao.Status.CORRIGIDA,
    )
    NotaAtividadeAluno.objects.create(
        aluno=cenario["aluno"], atividade=atv, nota_override=92,
        override_por=cenario["coordenador"],
    )
    media = Atividade.calcular_media_geral_aluno(cenario["aluno"], cenario["turma"])
    assert media == 92


@pytest.mark.django_db
def test_responsavel_aluno_unique_together(cenario):
    with pytest.raises(IntegrityError):
        ResponsavelAluno.objects.create(
            responsavel=cenario["responsavel"], aluno=cenario["aluno"]
        )


@pytest.mark.django_db
def test_exercicio_ordering_por_ordem(cenario, make_atividade):
    atv = make_atividade(turma=cenario["turma"], criado_por=cenario["professor"], com_exercicios=False)
    Exercicio.objects.create(
        atividade=atv, ordem=2, tipo=Exercicio.Tipo.MULTIPLA_ESCOLHA,
        enunciado="2", gabarito_esperado="A", alternativas={"A": "."},
    )
    Exercicio.objects.create(
        atividade=atv, ordem=1, tipo=Exercicio.Tipo.MULTIPLA_ESCOLHA,
        enunciado="1", gabarito_esperado="A", alternativas={"A": "."},
    )
    ordens = list(atv.exercicios.values_list("ordem", flat=True))
    assert ordens == [1, 2]
