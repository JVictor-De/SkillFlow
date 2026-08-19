import { absolutizeMediaUrl, api } from "./api";
import {
  delay,
  mockAlunos,
  mockAnalytics,
  mockAtividades,
  mockProfessores,
  mockResponsaveis,
  mockSubmissaoDetalhe,
  mockSubmissoes,
  mockTurmas,
  useMocks,
} from "./mocks";
import type {
  AlunoResumo,
  AnalyticsTurma,
  Atividade,
  AtividadeStatus,
  AtividadeTipo,
  Exercicio,
  MaterialApoio,
  ProfessorResumo,
  RankingItem,
  RankingResponse,
  ResponsavelResumo,
  SubmissaoDetalhe,
  SubmissaoLista,
  SubmissaoStatus,
  Turma,
} from "@/types";

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---------------------------------------------------------------------------
// Adapters — translate between SkillFlow API shapes and the frontend types.
// The backend uses snake-cased Portuguese (qtd_alunos, tipo_atividade, ...);
// the frontend types favour shorter aliases (total_alunos, atividade_tipo).
// These adapters keep the divergence in a single place so pages stay simple.
// ---------------------------------------------------------------------------

function mapTurma(raw: Record<string, any>, fallbackEscola = ""): Turma {
  return {
    id: Number(raw.id),
    nome: String(raw.nome ?? ""),
    escola_id: Number(raw.escola_id ?? 0),
    escola_nome: String(raw.escola_nome ?? fallbackEscola),
    total_alunos: Number(raw.qtd_alunos ?? raw.total_alunos ?? 0),
    total_atividades: Number(raw.qtd_atividades ?? raw.total_atividades ?? 0),
    ranking_pontuacao_ativo: Boolean(raw.ranking_pontuacao_ativo),
    ranking_provas_ativo: Boolean(raw.ranking_provas_ativo),
  };
}

function mapAluno(raw: Record<string, any>): AlunoResumo {
  return {
    id: Number(raw.id),
    nome: String(raw.nome ?? raw.email ?? ""),
    email: String(raw.email ?? ""),
    turma_id: Number(raw.turma_id ?? 0),
    turma_nome: String(raw.turma_nome ?? ""),
    media_geral:
      typeof raw.media_geral_ponderada === "number"
        ? raw.media_geral_ponderada
        : (raw.media_geral ?? null),
  };
}

function mapExercicio(raw: Record<string, any>): Exercicio {
  // Backend stores alternativas as a dict {"A": "texto", ...}; the frontend
  // editor uses a list shape so it can preserve order and bind inputs.
  let alternativas: Exercicio["alternativas"] = null;
  if (raw.alternativas && typeof raw.alternativas === "object") {
    if (Array.isArray(raw.alternativas)) {
      alternativas = raw.alternativas as Exercicio["alternativas"];
    } else {
      alternativas = Object.entries(raw.alternativas).map(([letra, texto]) => ({
        letra,
        texto: String(texto ?? ""),
      }));
    }
  }
  return {
    id: raw.id,
    ordem: Number(raw.ordem ?? 1),
    tipo: (raw.tipo ?? "MULTIPLA_ESCOLHA") as Exercicio["tipo"],
    enunciado: String(raw.enunciado ?? ""),
    gabarito_esperado: String(raw.gabarito_esperado ?? ""),
    alternativas,
  };
}

function mapAtividade(raw: Record<string, any>): Atividade {
  return {
    id: Number(raw.id),
    titulo: String(raw.titulo ?? ""),
    disciplina: String(raw.disciplina ?? ""),
    tipo_atividade: (raw.tipo_atividade ?? "EXERCICIO") as AtividadeTipo,
    peso: Number(raw.peso ?? 1),
    status_publicacao: (raw.status_publicacao ?? "DRAFT") as AtividadeStatus,
    data_liberacao: raw.data_liberacao ?? null,
    data_limite: raw.data_limite ?? null,
    turma_id: Number(raw.turma_id ?? 0),
    turma_nome: String(raw.turma_nome ?? ""),
    exercicios: Array.isArray(raw.exercicios)
      ? raw.exercicios.map(mapExercicio)
      : [],
    total_alunos: raw.total_alunos ?? raw.qtd_alunos ?? 0,
    total_submissoes:
      raw.total_submissoes ?? raw.qtd_submissoes ?? raw.qtd_exercicios ?? 0,
  };
}

function alternativasToDict(
  alternativas: Exercicio["alternativas"],
): Record<string, string> | null {
  if (!alternativas || !Array.isArray(alternativas)) return null;
  return alternativas.reduce<Record<string, string>>((acc, alt) => {
    if (alt.letra) acc[alt.letra] = alt.texto ?? "";
    return acc;
  }, {});
}

function mapSubmissao(raw: Record<string, any>): SubmissaoLista {
  return {
    id: Number(raw.id),
    aluno_id: Number(raw.aluno_id ?? 0),
    aluno_nome: String(raw.aluno_nome ?? ""),
    atividade_id: Number(raw.atividade_id ?? 0),
    atividade_titulo: String(raw.atividade_titulo ?? ""),
    atividade_tipo: (raw.tipo_atividade ?? raw.atividade_tipo ?? "EXERCICIO") as AtividadeTipo,
    exercicio_id: Number(raw.exercicio_id ?? 0),
    exercicio_ordem: Number(raw.exercicio_ordem ?? 1),
    exercicio_tipo: (raw.tipo_exercicio ?? raw.exercicio_tipo ?? "MULTIPLA_ESCOLHA") as Exercicio["tipo"],
    nota_calculada: raw.nota_calculada ?? null,
    nota_final: raw.nota_final ?? null,
    status: (raw.status ?? "PENDENTE") as SubmissaoStatus,
    turma_id: Number(raw.turma_id ?? 0),
    turma_nome: String(raw.turma_nome ?? ""),
  };
}

/**
 * Detalhe de submissão usado na tela `dashboard/submissoes/[id]`.
 *
 * Mapper exportado (não só `private`) para que possamos testá-lo direto
 * sem mockar a camada de fetch — ver `__tests__/services-mappers.test.ts`.
 *
 * `pdf_url` passa sempre por `absolutizeMediaUrl`. Mesmo que o backend
 * já retorne URL absoluta (após o fix de `request.build_absolute_uri`),
 * mantemos o helper como rede de segurança: payloads antigos, mocks e
 * S3 continuam roteando corretamente.
 */
export function mapSubmissaoDetalhe(
  raw: Record<string, any>,
): SubmissaoDetalhe {
  const base = mapSubmissao(raw);
  return {
    ...base,
    enunciado: String(raw.enunciado ?? ""),
    gabarito: String(raw.gabarito ?? raw.gabarito_esperado ?? ""),
    resposta_texto: raw.resposta_texto ?? null,
    pdf_url: absolutizeMediaUrl(raw.pdf_url ?? null),
    feedback_ia: raw.feedback_ia ?? null,
    feedback_professor: raw.feedback_professor ?? null,
    nota_professor_override: raw.nota_professor_override ?? null,
  };
}

export async function listTurmas(): Promise<Turma[]> {
  if (useMocks) return delay(mockTurmas);
  const data = await api.get<PaginatedResponse<Record<string, any>>>(
    "/api/saas/turmas/",
  );
  return data.results.map((row) => mapTurma(row));
}

export async function getTurma(id: number): Promise<Turma> {
  if (useMocks) {
    const turma = mockTurmas.find((t) => t.id === id) ?? mockTurmas[0];
    return delay(turma);
  }
  const raw = await api.get<Record<string, any>>(`/api/saas/turmas/${id}/`);
  return mapTurma(raw);
}

export async function cadastrarTurma(data: { nome: string }): Promise<Turma> {
  if (useMocks) {
    const novaId =
      mockTurmas.reduce((max, t) => (t.id > max ? t.id : max), 0) + 1;
    const escolaRef = mockTurmas[0];
    const nova: Turma = {
      id: novaId,
      nome: data.nome,
      escola_id: escolaRef?.escola_id ?? 1,
      escola_nome: escolaRef?.escola_nome ?? "Colégio Horizonte",
      total_alunos: 0,
      total_atividades: 0,
      ranking_pontuacao_ativo: false,
      ranking_provas_ativo: false,
    };
    return delay(nova);
  }
  const raw = await api.post<Record<string, any>>("/api/saas/turmas/", data);
  return mapTurma(raw);
}

export async function listAlunosTurma(id: number): Promise<AlunoResumo[]> {
  if (useMocks) {
    return delay(mockAlunos.filter((a) => a.turma_id === id));
  }
  const data = await api.get<PaginatedResponse<Record<string, any>>>(
    `/api/saas/turmas/${id}/alunos/`,
  );
  return data.results.map(mapAluno);
}

export async function listAtividades(params?: {
  turma_id?: number;
  tipo?: "EXERCICIO" | "PROVA";
}): Promise<Atividade[]> {
  if (useMocks) {
    let result = mockAtividades;
    if (params?.turma_id) {
      result = result.filter((a) => a.turma_id === params.turma_id);
    }
    if (params?.tipo) {
      result = result.filter((a) => a.tipo_atividade === params.tipo);
    }
    return delay(result);
  }
  const data = await api.get<PaginatedResponse<Record<string, any>>>(
    "/api/saas/atividades/",
    {
      query: { turma_id: params?.turma_id, tipo: params?.tipo },
    },
  );
  return data.results.map(mapAtividade);
}

export async function getAtividade(id: number): Promise<Atividade> {
  if (useMocks) {
    const atividade =
      mockAtividades.find((a) => a.id === id) ?? mockAtividades[0];
    return delay(atividade);
  }
  // The SaaS API doesn't expose a single-atividade detail endpoint, so we
  // fetch the list filtered by turma — the create/update endpoints already
  // return the full detail shape.
  const list = await api.get<PaginatedResponse<Record<string, any>>>(
    "/api/saas/atividades/",
  );
  const found = list.results.find((row) => Number(row.id) === id);
  if (!found) throw new Error("Atividade não encontrada.");
  return mapAtividade(found);
}

export interface CreateAtividadeInput {
  titulo: string;
  disciplina: string;
  turma_id: number;
  tipo_atividade: "EXERCICIO" | "PROVA";
  peso?: number;
  data_liberacao?: string | null;
  data_limite?: string | null;
  exercicios: Atividade["exercicios"];
}

export async function createAtividade(
  input: CreateAtividadeInput,
): Promise<Atividade> {
  if (useMocks) {
    const novo: Atividade = {
      id: Math.floor(Math.random() * 100000),
      titulo: input.titulo,
      disciplina: input.disciplina,
      tipo_atividade: input.tipo_atividade,
      peso: input.tipo_atividade === "EXERCICIO" ? 1 : (input.peso ?? 1),
      status_publicacao: "DRAFT",
      data_liberacao: input.data_liberacao ?? null,
      data_limite: input.data_limite ?? null,
      turma_id: input.turma_id,
      turma_nome:
        mockTurmas.find((t) => t.id === input.turma_id)?.nome ?? "Turma",
      exercicios: input.exercicios,
      total_alunos: 0,
      total_submissoes: 0,
    };
    return delay(novo);
  }
  const payload = {
    titulo: input.titulo,
    disciplina: input.disciplina,
    turma_id: input.turma_id,
    tipo_atividade: input.tipo_atividade,
    peso: input.peso ?? (input.tipo_atividade === "EXERCICIO" ? 1 : 1),
    data_liberacao: input.data_liberacao,
    data_limite: input.data_limite,
    exercicios: input.exercicios.map((ex) => ({
      ordem: ex.ordem,
      tipo: ex.tipo,
      enunciado: ex.enunciado,
      gabarito_esperado: ex.gabarito_esperado,
      alternativas: alternativasToDict(ex.alternativas),
    })),
  };
  const raw = await api.post<Record<string, any>>(
    "/api/saas/atividades/",
    payload,
  );
  return mapAtividade(raw);
}

export async function aprovarAgendar(
  id: number,
  data_liberacao: string,
  data_limite: string,
  status: AtividadeStatus,
): Promise<Atividade> {
  if (useMocks) {
    const atividade =
      mockAtividades.find((a) => a.id === id) ?? mockAtividades[0];
    return delay({
      ...atividade,
      data_liberacao,
      data_limite,
      status_publicacao: status,
    });
  }
  const raw = await api.put<Record<string, any>>(
    `/api/saas/atividades/${id}/aprovar-agendar/`,
    {
      data_liberacao,
      data_limite,
      status_publicacao: status,
    },
  );
  return mapAtividade(raw);
}

export async function listSubmissoes(params?: {
  turma_id?: number;
  status?: string;
  tipo?: string;
}): Promise<SubmissaoLista[]> {
  if (useMocks) {
    let result = mockSubmissoes;
    if (params?.turma_id) {
      result = result.filter((s) => s.turma_id === params.turma_id);
    }
    if (params?.status) {
      result = result.filter((s) => s.status === params.status);
    }
    if (params?.tipo) {
      result = result.filter((s) => s.atividade_tipo === params.tipo);
    }
    return delay(result);
  }
  const data = await api.get<PaginatedResponse<Record<string, any>>>(
    "/api/saas/submissoes/",
    { query: params },
  );
  return data.results.map(mapSubmissao);
}

export async function getSubmissao(id: number): Promise<SubmissaoDetalhe> {
  if (useMocks) {
    return delay({ ...mockSubmissaoDetalhe, id });
  }
  const raw = await api.get<Record<string, any>>(
    `/api/saas/submissoes/${id}/`,
  );
  return mapSubmissaoDetalhe(raw);
}

export async function overrideNota(
  id: number,
  payload: { nota?: number; feedback?: string },
): Promise<SubmissaoDetalhe> {
  if (useMocks) {
    return delay({
      ...mockSubmissaoDetalhe,
      id,
      nota_professor_override: payload.nota ?? null,
      feedback_professor: payload.feedback ?? null,
      status: "REVISADA_PROFESSOR",
      nota_final: payload.nota ?? mockSubmissaoDetalhe.nota_final,
    });
  }
  const raw = await api.put<Record<string, any>>(
    `/api/saas/submissoes/${id}/override-nota/`,
    payload,
  );
  return mapSubmissaoDetalhe(raw);
}

export async function getAnalytics(turmaId: number): Promise<AnalyticsTurma> {
  if (useMocks) {
    return delay({
      ...mockAnalytics,
      turma_id: turmaId,
      turma_nome:
        mockTurmas.find((t) => t.id === turmaId)?.nome ??
        mockAnalytics.turma_nome,
    });
  }
  const raw = await api.get<Record<string, any>>(
    `/api/saas/turmas/${turmaId}/analytics/`,
  );
  // Backend returns: distribuicao_erros, por_disciplina, por_tipo_atividade,
  // alunos_risco. Normalise to the frontend shape (per_categoria_erro etc.).
  return {
    turma_id: turmaId,
    turma_nome:
      mockTurmas.find((t) => t.id === turmaId)?.nome ?? `Turma ${turmaId}`,
    por_categoria_erro: (raw.distribuicao_erros ?? []).map(
      (e: Record<string, any>) => ({
        categoria: String(e.classificacao_erro ?? e.categoria ?? ""),
        total: Number(e.count ?? e.total ?? 0),
      }),
    ),
    por_disciplina: (raw.por_disciplina ?? []).map(
      (e: Record<string, any>) => ({
        disciplina: String(e.disciplina ?? ""),
        media: Number(e.media_nota ?? e.media ?? 0),
      }),
    ),
    alunos_em_risco: (raw.alunos_risco ?? raw.alunos_em_risco ?? []).map(
      (e: Record<string, any>) => ({
        aluno_id: Number(e.aluno_id ?? 0),
        aluno_nome: String(e.nome ?? e.aluno_nome ?? ""),
        media: Number(e.media_ponderada ?? e.media ?? 0),
      }),
    ),
  };
}

export async function listProfessores(): Promise<ProfessorResumo[]> {
  if (useMocks) return delay(mockProfessores);
  const data = await api.get<PaginatedResponse<Record<string, any>>>(
    "/api/saas/professores/",
  );
  return data.results.map((p) => ({
    id: Number(p.id),
    nome: String(p.nome ?? p.email ?? ""),
    email: String(p.email ?? ""),
    turmas: Array.isArray(p.turmas)
      ? p.turmas.map((t: Record<string, any>) => ({
          id: Number(t.id ?? 0),
          nome: String(t.nome ?? ""),
        }))
      : [],
  }));
}

export async function listResponsaveis(): Promise<ResponsavelResumo[]> {
  if (useMocks) return delay(mockResponsaveis);
  const data = await api.get<PaginatedResponse<Record<string, any>>>(
    "/api/saas/responsaveis/",
  );
  return data.results.map((r) => ({
    id: Number(r.id),
    nome: String(r.nome ?? r.email ?? ""),
    email: String(r.email ?? ""),
    alunos: Array.isArray(r.alunos)
      ? r.alunos.map((a: Record<string, any>) => ({
          id: Number(a.id ?? 0),
          nome: String(a.nome ?? ""),
          turma_nome: String(a.turma_nome ?? ""),
        }))
      : [],
  }));
}

export async function cadastrarAluno(
  turmaId: number,
  payload: { nome: string; email: string },
): Promise<{ aluno: AlunoResumo; senha_provisoria: string }> {
  if (useMocks) {
    const novo: AlunoResumo = {
      id: 9000 + mockAlunos.length,
      nome: payload.nome,
      email: payload.email,
      turma_id: turmaId,
      turma_nome:
        mockTurmas.find((t) => t.id === turmaId)?.nome ?? "Turma",
      media_geral: null,
    };
    return delay({
      aluno: novo,
      senha_provisoria: "Sk!ll-" + Math.random().toString(36).slice(2, 8),
    });
  }
  const raw = await api.post<Record<string, any>>(
    `/api/saas/turmas/${turmaId}/alunos/cadastrar/`,
    payload,
  );
  return {
    aluno: {
      id: Number(raw.id),
      nome: String(raw.nome ?? payload.nome),
      email: String(raw.email ?? payload.email),
      turma_id: turmaId,
      turma_nome:
        mockTurmas.find((t) => t.id === turmaId)?.nome ?? "Turma",
      media_geral: null,
    },
    senha_provisoria: String(raw.senha_provisoria ?? ""),
  };
}

export async function cadastrarMassa(
  turmaId: number,
  file: File,
): Promise<{ relatorio_id: number; status: string }> {
  if (useMocks) {
    return delay({
      relatorio_id: Math.floor(Math.random() * 9999),
      status: "PROCESSANDO",
    });
  }
  const fd = new FormData();
  // Backend endpoint expects the file under the `pdf` field.
  fd.append("pdf", file);
  return api.post(`/api/saas/turmas/${turmaId}/alunos/cadastrar-massa/`, fd);
}

export async function setRanking(
  turmaId: number,
  payload: {
    ranking_pontuacao_ativo: boolean;
    ranking_provas_ativo: boolean;
  },
): Promise<Turma> {
  if (useMocks) {
    const turma =
      mockTurmas.find((t) => t.id === turmaId) ?? mockTurmas[0];
    return delay({ ...turma, ...payload });
  }
  const raw = await api.put<Record<string, any>>(
    `/api/saas/turmas/${turmaId}/ranking/`,
    payload,
  );
  return mapTurma(raw);
}

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

/**
 * Mapper pequeno para o ranking exposto em
 * `GET /api/saas/turmas/{id}/ranking/`. O backend devolve `ranking` e
 * `itens` (mesma lista, dois aliases — ver
 * `apps.atividades.services.construir_ranking`). Aqui escolhemos o que
 * existir e mapeamos `nome`/`aluno_nome` para garantir uma única chave
 * no consumidor.
 */
function mapRanking(raw: Record<string, any>): RankingResponse {
  const lista: any[] = Array.isArray(raw.itens)
    ? raw.itens
    : Array.isArray(raw.ranking)
      ? raw.ranking
      : [];
  const itens: RankingItem[] = lista.map((row) => ({
    posicao: Number(row.posicao ?? 0),
    aluno_id: Number(row.aluno_id ?? 0),
    aluno_nome: String(row.aluno_nome ?? row.nome ?? ""),
    pontuacao: Number(row.pontuacao ?? 0),
  }));
  return {
    ativo: Boolean(raw.ativo ?? true),
    mensagem: raw.mensagem ?? undefined,
    itens,
  };
}

export async function getRankingTurma(
  turmaId: number,
  tipo: "pontuacao" | "provas" = "pontuacao",
): Promise<RankingResponse> {
  if (useMocks) {
    const turma = mockTurmas.find((t) => t.id === turmaId);
    const ranking: RankingItem[] = mockAlunos
      .filter((a) => a.turma_id === turmaId)
      .map((a, idx) => ({
        posicao: idx + 1,
        aluno_id: a.id,
        aluno_nome: a.nome,
        pontuacao:
          tipo === "provas"
            ? Math.max(0, (a.media_geral ?? 0) - (idx % 3) * 5)
            : Math.max(0, ((a.media_geral ?? 0) - 30) * 10),
      }))
      .sort((x, y) => y.pontuacao - x.pontuacao)
      .map((row, idx) => ({ ...row, posicao: idx + 1 }));
    return delay({
      ativo: true,
      itens: ranking,
    });
  }
  const raw = await api.get<Record<string, any>>(
    `/api/saas/turmas/${turmaId}/ranking/`,
    { query: { tipo } },
  );
  return mapRanking(raw);
}

// ---------------------------------------------------------------------------
// Materiais de apoio (PDF) — usados para gerar exercícios via RAG e como
// banco de apostilas da turma. O backend expõe upload via multipart e
// listagem paginada em `/api/saas/turmas/{id}/materiais/`.
// ---------------------------------------------------------------------------

/**
 * Material de apoio (PDF) listado em `dashboard/turmas/[id]` (aba
 * Materiais). Exportado para testes de mapeamento.
 *
 * `arquivo_url` é passado por `absolutizeMediaUrl` para garantir que o
 * link aponte para o domínio da API (Django) mesmo quando o backend
 * devolver caminho relativo — caso contrário o `<a target="_blank">`
 * resolve no domínio do Next.js e retorna 404.
 */
export function mapMaterial(raw: Record<string, any>): MaterialApoio {
  return {
    id: Number(raw.id),
    titulo: String(raw.titulo ?? ""),
    arquivo_url: absolutizeMediaUrl(raw.arquivo_url ?? "") ?? "",
    turma_id: Number(raw.turma_id ?? 0),
    enviado_por_id: Number(raw.enviado_por_id ?? 0),
    criado_em: String(raw.criado_em ?? ""),
  };
}

export async function listMateriaisTurma(
  turmaId: number,
): Promise<MaterialApoio[]> {
  if (useMocks) {
    return delay([
      {
        id: 1,
        titulo: "Apostila — Revolução Industrial",
        arquivo_url: "#",
        turma_id: turmaId,
        enviado_por_id: 1,
        criado_em: new Date(Date.now() - 86_400_000).toISOString(),
      },
      {
        id: 2,
        titulo: "Resumo — Funções",
        arquivo_url: "#",
        turma_id: turmaId,
        enviado_por_id: 1,
        criado_em: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      },
    ]);
  }
  const data = await api.get<PaginatedResponse<Record<string, any>>>(
    `/api/saas/turmas/${turmaId}/materiais/`,
  );
  return data.results.map(mapMaterial);
}

export async function uploadMaterialTurma(
  turmaId: number,
  payload: { titulo: string; file: File },
): Promise<MaterialApoio> {
  if (useMocks) {
    return delay({
      id: Math.floor(Math.random() * 9999),
      titulo: payload.titulo,
      arquivo_url: "#",
      turma_id: turmaId,
      enviado_por_id: 1,
      criado_em: new Date().toISOString(),
    });
  }
  const fd = new FormData();
  fd.append("arquivo", payload.file);
  // O backend declara `titulo` como query param; mandamos via URL para
  // não conflitar com o multipart body.
  const raw = await api.post<Record<string, any>>(
    `/api/saas/turmas/${turmaId}/materiais/?titulo=${encodeURIComponent(payload.titulo)}`,
    fd,
  );
  return mapMaterial(raw);
}

// ---------------------------------------------------------------------------
// Atividade actions — fechar (encerra prazo) e excluir.
// ---------------------------------------------------------------------------

export async function fecharAtividade(id: number): Promise<Atividade> {
  if (useMocks) {
    const atv =
      mockAtividades.find((a) => a.id === id) ?? mockAtividades[0];
    return delay({
      ...atv,
      status_publicacao: "PUBLICADO",
      data_limite: new Date().toISOString(),
    });
  }
  const raw = await api.put<Record<string, any>>(
    `/api/saas/atividades/${id}/fechar/`,
  );
  return mapAtividade(raw);
}

export async function excluirAtividade(
  id: number,
  options?: { force?: boolean },
): Promise<void> {
  if (useMocks) {
    await delay(null, 220);
    return;
  }
  const path = options?.force
    ? `/api/saas/atividades/${id}/?force=true`
    : `/api/saas/atividades/${id}/`;
  await api.delete(path);
}

export async function getHistoricoAluno(
  alunoId: number,
): Promise<SubmissaoLista[]> {
  if (useMocks) {
    return delay(mockSubmissoes.filter((s) => s.aluno_id === alunoId));
  }
  // Coordenador-only endpoint that returns submissions across all turmas
  // the student passed through (used by the histórico page).
  const raw = await api.get<Array<Record<string, any>>>(
    `/api/saas/alunos/${alunoId}/historico/`,
  );
  return raw.map((row) => ({
    id: Number(row.submissao_id ?? row.id ?? 0),
    aluno_id: alunoId,
    aluno_nome: "",
    atividade_id: Number(row.atividade_id ?? 0),
    atividade_titulo: String(row.atividade_titulo ?? ""),
    atividade_tipo: (row.tipo_atividade ?? "EXERCICIO") as AtividadeTipo,
    exercicio_id: 0,
    exercicio_ordem: 0,
    exercicio_tipo: "MULTIPLA_ESCOLHA" as Exercicio["tipo"],
    nota_calculada: row.nota ?? null,
    nota_final: row.nota ?? null,
    status: (row.status ?? "PENDENTE") as SubmissaoStatus,
    turma_id: Number(row.turma_id ?? 0),
    turma_nome: String(row.turma_nome ?? ""),
  }));
}
