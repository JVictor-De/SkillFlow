"""`python manage.py seed_data` — populate a realistic demo dataset.

Output: 2 escolas, 4 turmas, 1 coordenador per escola, 3 professores
(distributed via ProfessorTurma), 20 alunos (5 per turma), 3 responsáveis,
some atividades (EXERCICIO + PROVA) with real exercises and a couple of
sample submissions for the analytics views.

Credentials are printed to stdout at the end.
"""
from __future__ import annotations

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import Usuario
from apps.atividades.models import Atividade, Exercicio, NotaAtividadeAluno
from apps.escolas.models import Escola, ProfessorTurma, Turma
from apps.responsaveis.models import ResponsavelAluno
from apps.submissoes.models import Submissao


SENHA_DEMO = "skillflow123"


class Command(BaseCommand):
    help = "Popula o banco com um dataset de demonstração."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Apaga dados antes de popular (uso somente em dev).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            self.stdout.write(self.style.WARNING("Resetando dados..."))
            Submissao.objects.all().delete()
            Exercicio.objects.all().delete()
            Atividade.objects.all().delete()
            NotaAtividadeAluno.objects.all().delete()
            ResponsavelAluno.objects.all().delete()
            ProfessorTurma.objects.all().delete()
            Usuario.objects.exclude(is_superuser=True).delete()
            Turma.objects.all().delete()
            Escola.objects.all().delete()

        # Escolas + turmas
        escola1 = Escola.objects.create(
            nome="Colégio Horizonte", cnpj="11.111.111/0001-11"
        )
        escola2 = Escola.objects.create(
            nome="Escola Inovação", cnpj="22.222.222/0001-22"
        )
        turma1a = Turma.objects.create(
            nome="1º Ano A",
            escola=escola1,
            ranking_pontuacao_ativo=True,
            ranking_provas_ativo=True,
        )
        turma1b = Turma.objects.create(
            nome="1º Ano B", escola=escola1
        )
        turma2a = Turma.objects.create(
            nome="2º Ano A", escola=escola2, ranking_pontuacao_ativo=True
        )
        turma2b = Turma.objects.create(
            nome="2º Ano B", escola=escola2
        )

        # Coordenadores — primary aliases match the README/login-mocks; the
        # numbered ones survive for tests that prefer disambiguating users.
        coord1 = self._make_user(
            "coordenador@skillflow.dev", "Maria Coordenadora",
            Usuario.Role.COORDENADOR, escola=escola1, senha_provisoria=False,
        )
        coord2 = self._make_user(
            "coord2@skillflow.dev", "João Coordenador",
            Usuario.Role.COORDENADOR, escola=escola2, senha_provisoria=False,
        )

        # Professores — `professor@` é o primário citado na demo. `novato@`
        # entra com senha provisória para exercitar o fluxo de troca obrigatória.
        prof1 = self._make_user(
            "professor@skillflow.dev", "Ana Pereira",
            Usuario.Role.PROFESSOR, senha_provisoria=False,
        )
        prof2 = self._make_user(
            "prof2@skillflow.dev", "Bruno Silva",
            Usuario.Role.PROFESSOR, senha_provisoria=False,
        )
        prof3 = self._make_user(
            "novato@skillflow.dev", "Carla Souza",
            Usuario.Role.PROFESSOR, senha_provisoria=True,
        )

        ProfessorTurma.objects.bulk_create(
            [
                ProfessorTurma(professor=prof1, turma=turma1a),
                ProfessorTurma(professor=prof1, turma=turma1b),
                ProfessorTurma(professor=prof2, turma=turma1a),
                ProfessorTurma(professor=prof2, turma=turma2a),
                ProfessorTurma(professor=prof3, turma=turma2a),
                ProfessorTurma(professor=prof3, turma=turma2b),
            ]
        )

        # Alunos — 5 por turma. O primeiro de turma1a tem o e-mail "amigável"
        # `aluno@skillflow.dev` (mesmo da demo) para casar com o README.
        alunos: dict[int, list[Usuario]] = {}
        idx = 1
        for turma in [turma1a, turma1b, turma2a, turma2b]:
            alunos[turma.id] = []
            for n in range(1, 6):
                if turma is turma1a and n == 1:
                    email = "aluno@skillflow.dev"
                    nome = "Aluno Demo"
                else:
                    email = f"aluno{idx}@skillflow.dev"
                    nome = f"Aluno {idx}"
                aluno = self._make_user(
                    email=email,
                    full_name=nome,
                    role=Usuario.Role.ALUNO,
                    turma=turma,
                    senha_provisoria=False,
                )
                alunos[turma.id].append(aluno)
                idx += 1

        # Responsáveis — `pais@` é o e-mail da demo (vinculado a aluno demo).
        resp1 = self._make_user(
            "pais@skillflow.dev", "Helena Mãe",
            Usuario.Role.RESPONSAVEL, escola=escola1, senha_provisoria=False,
        )
        resp2 = self._make_user(
            "resp2@skillflow.dev", "Igor Pai",
            Usuario.Role.RESPONSAVEL, escola=escola1, senha_provisoria=False,
        )
        resp3 = self._make_user(
            "resp3@skillflow.dev", "Júlia Mãe",
            Usuario.Role.RESPONSAVEL, escola=escola2, senha_provisoria=False,
        )
        ResponsavelAluno.objects.bulk_create(
            [
                ResponsavelAluno(responsavel=resp1, aluno=alunos[turma1a.id][0]),
                ResponsavelAluno(responsavel=resp1, aluno=alunos[turma1a.id][1]),
                ResponsavelAluno(responsavel=resp2, aluno=alunos[turma1b.id][0]),
                ResponsavelAluno(responsavel=resp3, aluno=alunos[turma2a.id][0]),
            ]
        )

        # Atividades
        agora = timezone.now()
        ex1 = Atividade.objects.create(
            titulo="Lista de exercícios — Frações",
            disciplina="Matemática",
            tipo_atividade=Atividade.TipoAtividade.EXERCICIO,
            peso=1,
            status_publicacao=Atividade.StatusPublicacao.PUBLICADO,
            data_liberacao=agora - timedelta(days=2),
            data_limite=agora + timedelta(days=5),
            turma=turma1a,
            criado_por=prof1,
        )
        Exercicio.objects.create(
            atividade=ex1, ordem=1,
            tipo=Exercicio.Tipo.MULTIPLA_ESCOLHA,
            enunciado="Quanto é 1/2 + 1/4?",
            gabarito_esperado="C",
            alternativas={"A": "1/8", "B": "1/3", "C": "3/4", "D": "1/6", "E": "5/8"},
        )
        Exercicio.objects.create(
            atividade=ex1, ordem=2,
            tipo=Exercicio.Tipo.DISSERTATIVA,
            enunciado="Explique como simplificar a fração 6/8.",
            gabarito_esperado="Dividir numerador e denominador por 2 → 3/4.",
        )
        Exercicio.objects.create(
            atividade=ex1, ordem=3,
            tipo=Exercicio.Tipo.MULTIPLA_ESCOLHA,
            enunciado="Qual o resultado de 2/3 * 3/5?",
            gabarito_esperado="B",
            alternativas={"A": "6/15", "B": "2/5", "C": "5/8", "D": "1/2", "E": "2/15"},
        )
        Exercicio.objects.create(
            atividade=ex1, ordem=4,
            tipo=Exercicio.Tipo.MULTIPLA_ESCOLHA,
            enunciado="Qual fração é equivalente a 4/6?",
            gabarito_esperado="D",
            alternativas={"A": "2/5", "B": "3/8", "C": "5/9", "D": "2/3", "E": "4/9"},
        )
        Exercicio.objects.create(
            atividade=ex1, ordem=5,
            tipo=Exercicio.Tipo.DISSERTATIVA,
            enunciado="Explique como transformar 3/4 em porcentagem.",
            gabarito_esperado="Dividir 3 por 4 e multiplicar por 100, resultando em 75%.",
        )

        prova1 = Atividade.objects.create(
            titulo="Prova bimestral — Interpretação de Texto",
            disciplina="Português",
            tipo_atividade=Atividade.TipoAtividade.PROVA,
            peso=3,
            status_publicacao=Atividade.StatusPublicacao.PUBLICADO,
            data_liberacao=agora - timedelta(days=10),
            data_limite=agora - timedelta(days=3),
            turma=turma1a,
            criado_por=prof1,
        )
        Exercicio.objects.create(
            atividade=prova1, ordem=1,
            tipo=Exercicio.Tipo.MULTIPLA_ESCOLHA,
            enunciado="Qual a ideia central do texto?",
            gabarito_esperado="B",
            alternativas={"A": "Tese A", "B": "Tese B", "C": "Tese C", "D": "Tese D", "E": "Tese E"},
        )
        Exercicio.objects.create(
            atividade=prova1, ordem=2,
            tipo=Exercicio.Tipo.DISSERTATIVA,
            enunciado="Justifique a atitude do personagem principal no terceiro parágrafo.",
            gabarito_esperado="Ele agiu por impulso devido ao susto.",
        )
        Exercicio.objects.create(
            atividade=prova1, ordem=3,
            tipo=Exercicio.Tipo.MULTIPLA_ESCOLHA,
            enunciado="Qual recurso linguístico predomina no segundo parágrafo?",
            gabarito_esperado="C",
            alternativas={"A": "Metáfora", "B": "Ironia", "C": "Comparação", "D": "Hipérbole", "E": "Eufemismo"},
        )

        # Nova Atividade: Ciências
        ativ_ciencias = Atividade.objects.create(
            titulo="Fotossíntese e Ecossistemas",
            disciplina="Ciências",
            tipo_atividade=Atividade.TipoAtividade.EXERCICIO,
            peso=2,
            status_publicacao=Atividade.StatusPublicacao.PUBLICADO,
            data_liberacao=agora - timedelta(days=1),
            data_limite=agora + timedelta(days=7),
            turma=turma1a,
            criado_por=prof1,
        )
        Exercicio.objects.create(
            atividade=ativ_ciencias, ordem=1,
            tipo=Exercicio.Tipo.MULTIPLA_ESCOLHA,
            enunciado="Qual gás as plantas absorvem durante a fotossíntese?",
            gabarito_esperado="A",
            alternativas={"A": "Dióxido de Carbono (CO2)", "B": "Oxigênio (O2)", "C": "Nitrogênio (N2)", "D": "Hélio (He)"},
        )
        Exercicio.objects.create(
            atividade=ativ_ciencias, ordem=2,
            tipo=Exercicio.Tipo.DISSERTATIVA,
            enunciado="Descreva a importância da luz solar no processo de fotossíntese.",
            gabarito_esperado="A luz solar fornece a energia necessária para converter água e CO2 em glicose.",
        )
        Exercicio.objects.create(
            atividade=ativ_ciencias, ordem=3,
            tipo=Exercicio.Tipo.MULTIPLA_ESCOLHA,
            enunciado="Em qual nível da cadeia alimentar os produtores se encontram?",
            gabarito_esperado="A",
            alternativas={"A": "Primeiro nível trófico", "B": "Segundo nível trófico", "C": "Terceiro nível trófico", "D": "Último nível trófico"},
        )
        Exercicio.objects.create(
            atividade=ativ_ciencias, ordem=4,
            tipo=Exercicio.Tipo.DISSERTATIVA,
            enunciado="Cite duas consequências do desmatamento para os ecossistemas.",
            gabarito_esperado="Perda de biodiversidade e desequilíbrio no ciclo da água.",
        )

        prova_matematica = Atividade.objects.create(
            titulo="Prova diagnóstica — Operações com Decimais",
            disciplina="Matemática",
            tipo_atividade=Atividade.TipoAtividade.PROVA,
            peso=2,
            status_publicacao=Atividade.StatusPublicacao.PUBLICADO,
            data_liberacao=agora - timedelta(days=7),
            data_limite=agora + timedelta(days=2),
            turma=turma1a,
            criado_por=prof2,
        )
        Exercicio.objects.create(
            atividade=prova_matematica, ordem=1,
            tipo=Exercicio.Tipo.MULTIPLA_ESCOLHA,
            enunciado="Quanto é 3,5 + 2,45?",
            gabarito_esperado="B",
            alternativas={"A": "5,85", "B": "5,95", "C": "5,75", "D": "6,05", "E": "6,15"},
        )
        Exercicio.objects.create(
            atividade=prova_matematica, ordem=2,
            tipo=Exercicio.Tipo.MULTIPLA_ESCOLHA,
            enunciado="Quanto é 7,2 - 3,8?",
            gabarito_esperado="A",
            alternativas={"A": "3,4", "B": "3,2", "C": "4,4", "D": "4,2", "E": "3,6"},
        )
        Exercicio.objects.create(
            atividade=prova_matematica, ordem=3,
            tipo=Exercicio.Tipo.DISSERTATIVA,
            enunciado="Explique o passo a passo para calcular 4,8 x 0,5.",
            gabarito_esperado="Multiplica-se 48 por 5 e ajusta-se duas casas decimais, resultando em 2,4.",
        )
        Exercicio.objects.create(
            atividade=prova_matematica, ordem=4,
            tipo=Exercicio.Tipo.DISSERTATIVA,
            enunciado="Resolva 9,6 dividido por 3 e descreva o raciocínio.",
            gabarito_esperado="Divide-se 96 por 3 e desloca-se uma casa decimal, obtendo 3,2.",
        )

        # Submissões de exemplo para alimentar o analytics.
        Submissao.objects.create(
            aluno=alunos[turma1a.id][0],
            exercicio=ex1.exercicios.get(ordem=1),
            resposta_texto="C",
            nota_calculada=100,
            feedback_ia="Resposta correta!",
            status=Submissao.Status.CORRIGIDA,
        )
        Submissao.objects.create(
            aluno=alunos[turma1a.id][1],
            exercicio=ex1.exercicios.get(ordem=1),
            resposta_texto="A",
            nota_calculada=0,
            feedback_ia="Resposta incorreta.",
            categoria_erro_analytics="Aritmética",
            status=Submissao.Status.CORRIGIDA,
        )
        Submissao.objects.create(
            aluno=alunos[turma1a.id][0],
            exercicio=prova1.exercicios.get(ordem=1),
            resposta_texto="B",
            nota_calculada=100,
            feedback_ia="Acerto.",
            status=Submissao.Status.CORRIGIDA,
        )
        Submissao.objects.create(
            aluno=alunos[turma1a.id][1],
            exercicio=prova1.exercicios.get(ordem=1),
            resposta_texto="A",
            nota_calculada=0,
            feedback_ia="Incorreta.",
            categoria_erro_analytics="Interpretação de Texto",
            status=Submissao.Status.CORRIGIDA,
        )
        Submissao.objects.create(
            aluno=alunos[turma1a.id][0],
            exercicio=ex1.exercicios.get(ordem=2),
            resposta_texto="Simplifiquei 6/8 para 3/4 dividindo ambos por 2.",
            nota_calculada=95,
            feedback_ia="Boa explicação, apenas poderia citar o máximo divisor comum.",
            status=Submissao.Status.CORRIGIDA,
        )
        Submissao.objects.create(
            aluno=alunos[turma1a.id][2],
            exercicio=ex1.exercicios.get(ordem=4),
            resposta_texto="D",
            nota_calculada=100,
            feedback_ia="Resposta correta.",
            status=Submissao.Status.CORRIGIDA,
        )
        Submissao.objects.create(
            aluno=alunos[turma1a.id][3],
            exercicio=ex1.exercicios.get(ordem=5),
            resposta_texto="3/4 equivale a 0,75 e também 75%.",
            nota_calculada=88,
            feedback_ia="Resposta correta com justificativa suficiente.",
            status=Submissao.Status.CORRIGIDA,
        )
        Submissao.objects.create(
            aluno=alunos[turma1a.id][2],
            exercicio=prova1.exercicios.get(ordem=2),
            resposta_texto="Ele tentou ajudar sem pensar nas consequências.",
            nota_calculada=65,
            feedback_ia="Ideia parcial; faltou citar o trecho-chave.",
            feedback_professor="Boa leitura geral, mas faltou evidência textual do 3º parágrafo.",
            nota_professor_override=75,
            override_por=prof1,
            status=Submissao.Status.REVISADA_PROFESSOR,
        )
        Submissao.objects.create(
            aluno=alunos[turma1a.id][4],
            exercicio=prova1.exercicios.get(ordem=3),
            resposta_texto="B",
            nota_calculada=0,
            feedback_ia="Alternativa incorreta.",
            categoria_erro_analytics="Leitura inferencial",
            status=Submissao.Status.CORRIGIDA,
        )
        Submissao.objects.create(
            aluno=alunos[turma1a.id][0],
            exercicio=ativ_ciencias.exercicios.get(ordem=2),
            resposta_texto="Sem luz, a planta não consegue produzir glicose.",
            status=Submissao.Status.PENDENTE,
        )
        Submissao.objects.create(
            aluno=alunos[turma1a.id][1],
            exercicio=ativ_ciencias.exercicios.get(ordem=3),
            resposta_texto="A",
            nota_calculada=100,
            feedback_ia="Perfeito.",
            status=Submissao.Status.CORRIGIDA,
        )
        Submissao.objects.create(
            aluno=alunos[turma1a.id][2],
            exercicio=ativ_ciencias.exercicios.get(ordem=4),
            resposta_texto="Desmatamento reduz habitats e afeta o regime de chuvas.",
            status=Submissao.Status.PENDENTE,
        )
        Submissao.objects.create(
            aluno=alunos[turma1a.id][3],
            exercicio=prova_matematica.exercicios.get(ordem=1),
            resposta_texto="B",
            nota_calculada=100,
            feedback_ia="Correta.",
            status=Submissao.Status.CORRIGIDA,
        )
        Submissao.objects.create(
            aluno=alunos[turma1a.id][3],
            exercicio=prova_matematica.exercicios.get(ordem=3),
            resposta_texto="48 x 5 = 240, depois ajusta duas casas para 2,40.",
            nota_calculada=80,
            feedback_ia="Correto, com pequena imprecisão de linguagem.",
            feedback_professor="Procedimento adequado; manter atenção à justificativa final.",
            nota_professor_override=90,
            override_por=prof2,
            status=Submissao.Status.REVISADA_PROFESSOR,
        )
        Submissao.objects.create(
            aluno=alunos[turma1a.id][4],
            exercicio=prova_matematica.exercicios.get(ordem=4),
            resposta_texto="9,6/3 = 3,2",
            status=Submissao.Status.PENDENTE,
        )

        self._print_credentials(coord1, coord2, prof1, prof2, prof3, resp1, alunos[turma1a.id][0])

    # --------------------------------------------------------------- helpers
    def _make_user(
        self,
        email: str,
        full_name: str,
        role: str,
        *,
        turma=None,
        escola=None,
        senha_provisoria: bool = True,
    ) -> Usuario:
        first, _, last = full_name.partition(" ")
        return Usuario.objects.create_user(
            email=email,
            password=SENHA_DEMO,
            username=email,
            first_name=first,
            last_name=last,
            role=role,
            turma=turma,
            escola=escola,
            senha_provisoria=senha_provisoria,
        )

    def _print_credentials(self, coord1, coord2, prof1, prof2, prof3, resp1, aluno):
        out = self.stdout
        out.write(self.style.SUCCESS("Seed concluído. Credenciais (senha = '%s'):" % SENHA_DEMO))
        for user, label in [
            (coord1, "Coordenador (Web)"),
            (coord2, "Coordenador escola2 (Web)"),
            (prof1, "Professor (Web · turma1a, turma1b)"),
            (prof2, "Professor 2 (Web · turma1a, turma2a)"),
            (prof3, "Professor Novato (Web · senha provisória)"),
            (resp1, "Responsável (Mobile · 2 filhos em turma1a)"),
            (aluno, "Aluno (Mobile · turma1a)"),
        ]:
            flag = " [must_change_password]" if user.senha_provisoria else ""
            out.write(f"  {label}: {user.email}{flag}")
