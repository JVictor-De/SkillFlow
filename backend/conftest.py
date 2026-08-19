"""Top-level conftest — sets DB engine to SQLite for fast tests and provides
the helpers + fixtures used across the suite.

Tests run with `CELERY_TASK_ALWAYS_EAGER=True` so async pipelines execute in
the foreground and assertions can inspect their effects directly.
"""
from __future__ import annotations

import os

os.environ.setdefault("USE_SQLITE", "1")
os.environ.setdefault("CELERY_TASK_ALWAYS_EAGER", "1")
os.environ.setdefault("DJANGO_SECRET_KEY", "test-secret")
os.environ.setdefault("DJANGO_DEBUG", "1")
os.environ.setdefault("LLM_PROVIDER", "mock")

import django  # noqa: E402

django.setup()

from datetime import timedelta  # noqa: E402

import pytest  # noqa: E402
from django.test import Client  # noqa: E402
from django.utils import timezone  # noqa: E402

from apps.accounts.models import Usuario  # noqa: E402
from apps.accounts.services import issue_tokens_for  # noqa: E402
from apps.atividades.models import Atividade, Exercicio  # noqa: E402
from apps.escolas.models import Escola, ProfessorTurma, Turma  # noqa: E402
from apps.responsaveis.models import ResponsavelAluno  # noqa: E402


@pytest.fixture
def client() -> Client:
    return Client()


@pytest.fixture
def auth_headers():
    """Build an `Authorization: Bearer <token>` dict for a given user."""

    def _make(user: Usuario) -> dict:
        tokens = issue_tokens_for(user)
        return {"HTTP_AUTHORIZATION": f"Bearer {tokens['access_token']}"}

    return _make


@pytest.fixture
def make_escola(db):
    counter = {"i": 0}

    def _make(nome: str | None = None, cnpj: str | None = None) -> Escola:
        counter["i"] += 1
        return Escola.objects.create(
            nome=nome or f"Escola {counter['i']}",
            cnpj=cnpj or f"00.000.000/000{counter['i']:01d}-00",
        )

    return _make


@pytest.fixture
def make_turma(db, make_escola):
    counter = {"i": 0}

    def _make(*, escola: Escola | None = None, nome: str | None = None, **kwargs) -> Turma:
        counter["i"] += 1
        escola = escola or make_escola()
        return Turma.objects.create(
            nome=nome or f"Turma {counter['i']}",
            escola=escola,
            **kwargs,
        )

    return _make


@pytest.fixture
def make_user(db):
    counter = {"i": 0}

    def _make(
        *,
        role: str = Usuario.Role.ALUNO,
        email: str | None = None,
        nome: str | None = None,
        senha: str = "Senha-Forte-123",
        turma: Turma | None = None,
        escola: Escola | None = None,
        senha_provisoria: bool = False,
    ) -> Usuario:
        counter["i"] += 1
        email = email or f"user{counter['i']}@skillflow.test"
        nome = nome or f"User {counter['i']}"
        first, _, last = nome.partition(" ")
        return Usuario.objects.create_user(
            email=email,
            password=senha,
            username=email,
            first_name=first,
            last_name=last,
            role=role,
            turma=turma,
            escola=escola,
            senha_provisoria=senha_provisoria,
        )

    return _make


@pytest.fixture
def make_atividade(db):
    counter = {"i": 0}

    def _make(
        *,
        turma: Turma,
        criado_por: Usuario,
        tipo: str = Atividade.TipoAtividade.EXERCICIO,
        peso: int | None = None,
        status: str = Atividade.StatusPublicacao.PUBLICADO,
        com_exercicios: bool = True,
        disciplina: str = "Matemática",
        data_liberacao=None,
        data_limite=None,
    ) -> Atividade:
        counter["i"] += 1
        if peso is None:
            peso = 1 if tipo == Atividade.TipoAtividade.EXERCICIO else 2
        agora = timezone.now()
        atv = Atividade.objects.create(
            titulo=f"Atividade {counter['i']}",
            disciplina=disciplina,
            tipo_atividade=tipo,
            peso=peso,
            status_publicacao=status,
            data_liberacao=data_liberacao or agora - timedelta(days=1),
            data_limite=data_limite or agora + timedelta(days=7),
            turma=turma,
            criado_por=criado_por,
        )
        if com_exercicios:
            Exercicio.objects.create(
                atividade=atv,
                ordem=1,
                tipo=Exercicio.Tipo.MULTIPLA_ESCOLHA,
                enunciado="Quanto é 2+2?",
                gabarito_esperado="C",
                alternativas={"A": "1", "B": "2", "C": "4", "D": "5", "E": "8"},
            )
            Exercicio.objects.create(
                atividade=atv,
                ordem=2,
                tipo=Exercicio.Tipo.DISSERTATIVA,
                enunciado="Explique a propriedade comutativa da soma.",
                gabarito_esperado="A ordem dos somandos não altera a soma.",
            )
        return atv

    return _make


@pytest.fixture
def cenario(make_escola, make_turma, make_user):
    """A small but coherent multi-tenant fixture used by most tests."""

    escola = make_escola(nome="Colégio Alpha")
    outra_escola = make_escola(nome="Outra Escola")
    turma = make_turma(escola=escola, nome="1A")
    turma_outra = make_turma(escola=outra_escola, nome="X1")

    coordenador = make_user(role=Usuario.Role.COORDENADOR, escola=escola)
    coordenador_outra = make_user(role=Usuario.Role.COORDENADOR, escola=outra_escola)
    professor = make_user(role=Usuario.Role.PROFESSOR)
    professor_alheio = make_user(role=Usuario.Role.PROFESSOR)
    aluno = make_user(role=Usuario.Role.ALUNO, turma=turma)
    aluno_outra = make_user(role=Usuario.Role.ALUNO, turma=turma_outra)
    responsavel = make_user(role=Usuario.Role.RESPONSAVEL, escola=escola)

    ProfessorTurma.objects.create(professor=professor, turma=turma)
    ResponsavelAluno.objects.create(responsavel=responsavel, aluno=aluno)

    return {
        "escola": escola,
        "outra_escola": outra_escola,
        "turma": turma,
        "turma_outra": turma_outra,
        "coordenador": coordenador,
        "coordenador_outra": coordenador_outra,
        "professor": professor,
        "professor_alheio": professor_alheio,
        "aluno": aluno,
        "aluno_outra": aluno_outra,
        "responsavel": responsavel,
    }
