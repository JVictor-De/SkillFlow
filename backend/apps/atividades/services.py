"""Business logic for atividades, ranking and painel computations."""
from __future__ import annotations

from collections import defaultdict
from typing import Iterable

from django.db.models import Q, QuerySet
from django.utils import timezone

from apps.accounts.models import Usuario
from apps.atividades.models import Atividade, Exercicio, NotaAtividadeAluno
from apps.escolas.models import Turma
from apps.submissoes.models import Submissao


# -------------------------------------------------------------- atividades qs
def queryset_atividades(user: Usuario, turma_id: int | None = None) -> QuerySet[Atividade]:
    """Return atividades visible to this docente, with optional turma filter."""
    qs = Atividade.objects.select_related("turma", "turma__escola")
    if user.is_coordenador:
        qs = qs.filter(turma__escola_id=user.escola_id)
    elif user.is_professor:
        qs = qs.filter(turma__vinculos_professor__professor=user)
    else:
        return Atividade.objects.none()
    if turma_id:
        qs = qs.filter(turma_id=turma_id)
    return qs.distinct()


# ----------------------------------------------------------------- analytics
def analytics_para_turma(turma: Turma) -> dict:
    submissoes_qs = Submissao.objects.filter(
        exercicio__atividade__turma=turma
    ).select_related("exercicio", "exercicio__atividade")

    distribuicao_erros: dict[str, int] = defaultdict(int)
    notas_por_disciplina: dict[str, list[int]] = defaultdict(list)
    notas_por_tipo: dict[str, list[int]] = defaultdict(list)

    for sub in submissoes_qs:
        if sub.categoria_erro_analytics:
            distribuicao_erros[sub.categoria_erro_analytics] += 1
        nota = sub.nota_final
        if nota is None:
            continue
        atividade = sub.exercicio.atividade
        notas_por_disciplina[atividade.disciplina].append(nota)
        notas_por_tipo[atividade.tipo_atividade].append(nota)

    total_erros = sum(distribuicao_erros.values()) or 1
    distribuicao = [
        {
            "classificacao_erro": cat,
            "count": cnt,
            "percentual": round(cnt * 100 / total_erros, 1),
        }
        for cat, cnt in sorted(distribuicao_erros.items(), key=lambda x: -x[1])
    ]
    por_disciplina = [
        {"disciplina": d, "media_nota": round(sum(notas) / len(notas))}
        for d, notas in notas_por_disciplina.items()
    ]
    por_tipo = [
        {"tipo": t, "media_nota": round(sum(notas) / len(notas))}
        for t, notas in notas_por_tipo.items()
    ]

    alunos_risco = []
    for aluno in turma.alunos.all():
        media = Atividade.calcular_media_geral_aluno(aluno, turma)
        if media is not None and media < 50:
            alunos_risco.append(
                {
                    "aluno_id": aluno.id,
                    "nome": (
                        f"{aluno.first_name} {aluno.last_name}"
                    ).strip()
                    or aluno.email,
                    "media_ponderada": media,
                }
            )

    return {
        "distribuicao_erros": distribuicao,
        "por_disciplina": por_disciplina,
        "por_tipo_atividade": por_tipo,
        "alunos_risco": alunos_risco,
    }


# ------------------------------------------------------------------- ranking
def construir_ranking(
    turma: Turma, tipo: str, *, force: bool = False
) -> dict:
    """Build the requested ranking for `turma`.

    `tipo` ∈ {"pontuacao", "provas"}. When `force=True` (SaaS view), the
    activation flag is bypassed.

    The returned payload exposes the ranking under BOTH `ranking` (legacy
    SaaS clients + existing tests) and `itens` (mobile app + Next.js
    types). Each row carries `nome` (legacy) and `aluno_nome` (used by
    the mobile/Next clients) so neither side has to deal with the
    mismatch on its own. Every aluno of the turma is always included —
    students without graded submissions get `pontuacao=0`.
    """
    tipo = tipo.lower()
    ativo = (
        turma.ranking_pontuacao_ativo
        if tipo == "pontuacao"
        else turma.ranking_provas_ativo
    )
    if not ativo and not force:
        return {
            "ativo": False,
            "tipo": tipo,
            "mensagem": "O ranking está desativado para esta turma.",
            "ranking": [],
            "itens": [],
        }

    ranking_items = []
    for aluno in turma.alunos.all():
        if tipo == "pontuacao":
            atividades = Atividade.objects.filter(
                turma=turma,
                status_publicacao=Atividade.StatusPublicacao.PUBLICADO,
            )
            soma = 0
            for atv in atividades:
                override = NotaAtividadeAluno.objects.filter(
                    aluno=aluno, atividade=atv
                ).first()
                nota = (
                    override.nota_override
                    if override
                    else atv.calcular_nota_aluno(aluno)
                )
                if nota is not None:
                    soma += nota
            pontuacao = soma
        else:  # provas — weighted average across exam-only activities.
            provas = Atividade.objects.filter(
                turma=turma,
                status_publicacao=Atividade.StatusPublicacao.PUBLICADO,
                tipo_atividade=Atividade.TipoAtividade.PROVA,
            )
            soma_pond = 0
            soma_pesos = 0
            for atv in provas:
                override = NotaAtividadeAluno.objects.filter(
                    aluno=aluno, atividade=atv
                ).first()
                nota = (
                    override.nota_override
                    if override
                    else atv.calcular_nota_aluno(aluno)
                )
                if nota is not None:
                    soma_pond += nota * (atv.peso or 1)
                    soma_pesos += atv.peso or 1
            pontuacao = (
                round(soma_pond / soma_pesos, 1) if soma_pesos else 0
            )
        nome_aluno = (
            f"{aluno.first_name} {aluno.last_name}"
        ).strip() or aluno.email
        ranking_items.append(
            {
                "aluno_id": aluno.id,
                "nome": nome_aluno,
                "aluno_nome": nome_aluno,
                "pontuacao": pontuacao,
            }
        )
    # Stable ordering: pontuação desc, depois nome asc (desempate consistente
    # entre alunos com 0 pontos para que o ranking não fique "tremendo").
    ranking_items.sort(key=lambda x: (-x["pontuacao"], x["aluno_nome"]))
    out = []
    for idx, item in enumerate(ranking_items, start=1):
        out.append({"posicao": idx, **item})
    return {
        "ativo": True,
        "tipo": tipo,
        "mensagem": None,
        "ranking": out,
        "itens": out,
    }


# ----------------------------------------------------------------- App painel
def painel_aluno(aluno: Usuario) -> dict:
    """Build the aluno dashboard payload.

    The shape mixes both the legacy keys used by the SaaS panel
    (`media_geral_ponderada`, `progresso_por_disciplina`, `historico_notas`)
    and the shorter aliases consumed by the mobile app (`media_geral`,
    `progresso_disciplinas`, `historico`). Keeping both prevents a Flutter
    type-cast crash ("Não foi possível carregar o painel") that used to
    happen when `media_geral_ponderada` came back as `None` and the mobile
    parser tried to cast it to `num`.

    Each historico entry also exposes `disciplina` + `tipo`, which the
    mobile UI relies on to render the discipline label and the
    PROVA/EXERCICIO badge.
    """
    if aluno.turma_id is None:
        return _painel_empty_payload()
    turma = aluno.turma
    media_geral = Atividade.calcular_media_geral_aluno(aluno, turma)

    notas_disciplina: dict[str, list[int]] = defaultdict(list)
    historico = []
    atividades = Atividade.objects.filter(
        turma=turma,
        status_publicacao=Atividade.StatusPublicacao.PUBLICADO,
    ).order_by("data_liberacao", "criado_em")
    pendentes = 0
    concluidas = 0
    em_andamento = 0
    now = timezone.now()
    for atv in atividades:
        override = NotaAtividadeAluno.objects.filter(
            aluno=aluno, atividade=atv
        ).first()
        nota = override.nota_override if override else atv.calcular_nota_aluno(aluno)
        if nota is not None:
            notas_disciplina[atv.disciplina].append(nota)
            historico.append(
                {
                    "atividade_id": atv.id,
                    "titulo": atv.titulo,
                    "disciplina": atv.disciplina,
                    "tipo": atv.tipo_atividade,
                    "nota": nota,
                    "data": atv.data_liberacao or atv.criado_em,
                }
            )
        ex_ids = list(atv.exercicios.values_list("id", flat=True))
        sub_count = Submissao.objects.filter(
            aluno=aluno, exercicio_id__in=ex_ids
        ).count()
        total_ex = len(ex_ids)
        if total_ex == 0:
            continue
        if sub_count == 0:
            if atv.data_limite and atv.data_limite > now:
                pendentes += 1
        elif sub_count < total_ex:
            em_andamento += 1
        else:
            concluidas += 1
    progresso = [
        {"disciplina": d, "media": round(sum(notas) / len(notas))}
        for d, notas in notas_disciplina.items()
    ]
    media_geral_safe = media_geral if media_geral is not None else 0
    return {
        # SaaS / legacy keys.
        "media_geral_ponderada": media_geral,
        "progresso_por_disciplina": progresso,
        "historico_notas": historico,
        # Mobile aliases (must always be non-null so the Flutter parser
        # never sees a NPE while casting).
        "media_geral": media_geral_safe,
        "progresso_disciplinas": progresso,
        "historico": historico,
        "atividades_pendentes": pendentes,
        "atividades_concluidas": concluidas,
        "atividades_em_andamento": em_andamento,
    }


def _painel_empty_payload() -> dict:
    return {
        "media_geral_ponderada": None,
        "progresso_por_disciplina": [],
        "historico_notas": [],
        "media_geral": 0,
        "progresso_disciplinas": [],
        "historico": [],
        "atividades_pendentes": 0,
        "atividades_concluidas": 0,
        "atividades_em_andamento": 0,
    }
