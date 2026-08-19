from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from apps.escolas.models import Escola, Turma, ProfessorTurma
from apps.responsaveis.models import ResponsavelAluno

Usuario = get_user_model()


class Command(BaseCommand):
    help = "Popula dados de teste essenciais (Escolas, Turmas, Admin, Coordenador, Professores, Alunos e Responsáveis) idempotentemente."

    def handle(self, *args, **options):
        # A senha padrão global
        DEFAULT_PASSWORD = "teste123"

        with transaction.atomic():
            self.stdout.write(self.style.WARNING("Iniciando a população de base de dados..."))
            counters = {
                "usuarios": {"created": 0, "updated": 0},
                "escolas": {"created": 0, "updated": 0},
                "turmas": {"created": 0, "updated": 0},
                "professor_turma": {"created": 0, "updated": 0},
                "responsavel_aluno": {"created": 0, "updated": 0},
            }

            # 1. Criação de Escolas e Turmas
            escola, escola_created = Escola.objects.update_or_create(
                cnpj="00.000.000/0001-00",
                defaults={"nome": "Escola Fictícia Tech"}
            )
            counters["escolas"]["created" if escola_created else "updated"] += 1

            turma_a, turma_a_created = Turma.objects.update_or_create(escola=escola, nome="Turma A - 1º Ano")
            counters["turmas"]["created" if turma_a_created else "updated"] += 1
            turma_b, turma_b_created = Turma.objects.update_or_create(escola=escola, nome="Turma B - 2º Ano")
            counters["turmas"]["created" if turma_b_created else "updated"] += 1

            # Função Helper de Usuários -> garante que a senha seja aplicada e as regras validadas
            def create_user(email, nome, role, is_super=False, **kwargs):
                # Extraindo dados e validando
                username = email.split("@")[0]
                user, created = Usuario.objects.update_or_create(
                    email=email,
                    defaults={
                        "username": username,
                        "first_name": nome,
                        "role": role,
                        "is_superuser": is_super,
                        "is_staff": is_super,
                        "senha_provisoria": False,
                        **kwargs
                    }
                )
                user.set_password(DEFAULT_PASSWORD)
                user.save(update_fields=["password"])
                counters["usuarios"]["created" if created else "updated"] += 1
                return user, created

            resumo = []

            # 2. Superadmin
            admin, _ = create_user(
                "admin@teste.com",
                "Super Admin",
                Usuario.Role.COORDENADOR,
                is_super=True,
                escola=escola,
            )
            resumo.append(("Super Admin", "Admin", admin.email))

            # 3. Gestor/Coordenador
            gestor, _ = create_user(
                "diretor@teste.com", "Diretor Tech", Usuario.Role.COORDENADOR, escola=escola
            )
            resumo.append(("Diretor Tech", "Coordenador", gestor.email))

            # 4. Professores e seus Links Pivot
            prof1, _ = create_user("prof1@teste.com", "Professor Turing", Usuario.Role.PROFESSOR)
            prof2, _ = create_user("prof2@teste.com", "Professor Lovelace", Usuario.Role.PROFESSOR)
            
            _, link_1_created = ProfessorTurma.objects.update_or_create(professor=prof1, turma=turma_a)
            counters["professor_turma"]["created" if link_1_created else "updated"] += 1
            _, link_2_created = ProfessorTurma.objects.update_or_create(professor=prof2, turma=turma_a)
            counters["professor_turma"]["created" if link_2_created else "updated"] += 1
            _, link_3_created = ProfessorTurma.objects.update_or_create(professor=prof2, turma=turma_b)
            counters["professor_turma"]["created" if link_3_created else "updated"] += 1
            
            resumo.append(("Professor Turing", "Professor", prof1.email))
            resumo.append(("Professor Lovelace", "Professor", prof2.email))

            # 5. Alunos
            aluno1, _ = create_user("aluno1@teste.com", "Aluno Um", Usuario.Role.ALUNO, turma=turma_a)
            aluno2, _ = create_user("aluno2@teste.com", "Aluno Dois", Usuario.Role.ALUNO, turma=turma_a)
            aluno3, _ = create_user("aluno3@teste.com", "Aluno Três", Usuario.Role.ALUNO, turma=turma_b)
            
            resumo.append(("Aluno Um", "Aluno", aluno1.email))
            resumo.append(("Aluno Dois", "Aluno", aluno2.email))
            resumo.append(("Aluno Três", "Aluno", aluno3.email))

            # 6. Responsáveis e seus Links Pivot
            resp1, _ = create_user(
                "resp1@teste.com", "Responsável Um", Usuario.Role.RESPONSAVEL, escola=escola
            )
            resp2, _ = create_user(
                "resp2@teste.com", "Responsável Dois", Usuario.Role.RESPONSAVEL, escola=escola
            )

            _, rel_1_created = ResponsavelAluno.objects.update_or_create(responsavel=resp1, aluno=aluno1)
            counters["responsavel_aluno"]["created" if rel_1_created else "updated"] += 1
            # O Responsável 2 tem dois dependentes
            _, rel_2_created = ResponsavelAluno.objects.update_or_create(responsavel=resp2, aluno=aluno2)
            counters["responsavel_aluno"]["created" if rel_2_created else "updated"] += 1
            _, rel_3_created = ResponsavelAluno.objects.update_or_create(responsavel=resp2, aluno=aluno3)
            counters["responsavel_aluno"]["created" if rel_3_created else "updated"] += 1

            resumo.append(("Responsável Um", "Responsável", resp1.email))
            resumo.append(("Responsável Dois", "Responsável", resp2.email))

        # Saída visual formatada
        self.stdout.write(self.style.SUCCESS("\nPopulação concluída com sucesso! (Senha padrão: teste123)\n"))
        self.stdout.write(f"{'NOME':<25} | {'TIPO':<15} | {'EMAIL'}")
        self.stdout.write("-" * 70)
        for nome, tipo, email in resumo:
            self.stdout.write(f"{nome:<25} | {tipo:<15} | {email}")

        self.stdout.write(
            self.style.SUCCESS(
                "\nResumo de criação/atualização:"
            )
        )
        self.stdout.write(
            f"- Escolas: criadas={counters['escolas']['created']} | atualizadas={counters['escolas']['updated']}"
        )
        self.stdout.write(
            f"- Turmas: criadas={counters['turmas']['created']} | atualizadas={counters['turmas']['updated']}"
        )
        self.stdout.write(
            f"- Usuários: criados={counters['usuarios']['created']} | atualizados={counters['usuarios']['updated']}"
        )
        self.stdout.write(
            f"- Vínculos Professor-Turma: criados={counters['professor_turma']['created']} | atualizados={counters['professor_turma']['updated']}"
        )
        self.stdout.write(
            f"- Vínculos Responsável-Aluno: criados={counters['responsavel_aluno']['created']} | atualizados={counters['responsavel_aluno']['updated']}"
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Total gerado: > 1 Escola > 2 Turmas > {len(resumo)} Usuários\n"
            )
        )
