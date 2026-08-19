export type UserRole =
  | "ALUNO"
  | "PROFESSOR"
  | "COORDENADOR"
  | "RESPONSAVEL";

export interface AuthUser {
  id: number;
  email: string;
  nome?: string;
  role: UserRole;
  must_change_password: boolean;
  escola_id?: number | null;
  escola_nome?: string | null;
  turma_id?: number | null;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export type AtividadeTipo = "EXERCICIO" | "PROVA";
export type AtividadeStatus = "DRAFT" | "AGENDADO" | "PUBLICADO";
/**
 * Question types supported by SkillFlow:
 *
 * - `MULTIPLA_ESCOLHA` — student picks one alternative.
 * - `DISSERTATIVA_TEXTO` — student types a free-text answer on the
 *   platform.
 * - `DISSERTATIVA` — student attaches a PDF with the answer (legacy
 *   value preserved for historical data; the UI labels it
 *   "Anexo (PDF)").
 */
export type ExercicioTipo =
  | "MULTIPLA_ESCOLHA"
  | "DISSERTATIVA_TEXTO"
  | "DISSERTATIVA";
export type SubmissaoStatus =
  | "PENDENTE"
  | "EM_PROCESSAMENTO"
  | "CORRIGIDA"
  | "REVISADA_PROFESSOR"
  | "CONFLITO_SYNC";

export interface Escola {
  id: number;
  nome: string;
  cnpj: string;
}

export interface Turma {
  id: number;
  nome: string;
  escola_id: number;
  escola_nome: string;
  total_alunos: number;
  total_atividades: number;
  ranking_pontuacao_ativo: boolean;
  ranking_provas_ativo: boolean;
}

export interface AlunoResumo {
  id: number;
  nome: string;
  email: string;
  turma_id: number;
  turma_nome: string;
  media_geral?: number | null;
}

export interface ProfessorResumo {
  id: number;
  nome: string;
  email: string;
  turmas: { id: number; nome: string }[];
}

export interface ResponsavelResumo {
  id: number;
  nome: string;
  email: string;
  alunos: { id: number; nome: string; turma_nome: string }[];
}

export interface Exercicio {
  id?: number;
  ordem: number;
  tipo: ExercicioTipo;
  enunciado: string;
  gabarito_esperado: string;
  alternativas?: { letra: string; texto: string }[] | null;
}

export interface Atividade {
  id: number;
  titulo: string;
  disciplina: string;
  tipo_atividade: AtividadeTipo;
  peso: number;
  status_publicacao: AtividadeStatus;
  data_liberacao: string | null;
  data_limite: string | null;
  turma_id: number;
  turma_nome: string;
  exercicios: Exercicio[];
  total_alunos?: number;
  total_submissoes?: number;
}

export interface SubmissaoLista {
  id: number;
  aluno_id: number;
  aluno_nome: string;
  atividade_id: number;
  atividade_titulo: string;
  atividade_tipo: AtividadeTipo;
  exercicio_id: number;
  exercicio_ordem: number;
  exercicio_tipo: ExercicioTipo;
  nota_calculada: number | null;
  nota_final: number | null;
  status: SubmissaoStatus;
  turma_id: number;
  turma_nome: string;
}

export interface SubmissaoDetalhe extends SubmissaoLista {
  enunciado: string;
  gabarito: string;
  resposta_texto: string | null;
  pdf_url: string | null;
  feedback_ia: string | null;
  feedback_professor: string | null;
  nota_professor_override: number | null;
}

export interface AnalyticsTurma {
  turma_id: number;
  turma_nome: string;
  por_categoria_erro: { categoria: string; total: number }[];
  por_disciplina: { disciplina: string; media: number }[];
  alunos_em_risco: {
    aluno_id: number;
    aluno_nome: string;
    media: number;
  }[];
}

export interface RankingItem {
  posicao: number;
  aluno_id: number;
  aluno_nome: string;
  pontuacao: number;
}

export interface RankingResponse {
  ativo: boolean;
  mensagem?: string;
  itens?: RankingItem[];
}

export interface MaterialApoio {
  id: number;
  titulo: string;
  arquivo_url: string;
  turma_id: number;
  enviado_por_id: number;
  criado_em: string;
}
