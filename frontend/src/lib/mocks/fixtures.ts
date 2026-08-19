import type {
  AlunoResumo,
  AnalyticsTurma,
  Atividade,
  AuthSession,
  AuthUser,
  ProfessorResumo,
  ResponsavelResumo,
  SubmissaoDetalhe,
  SubmissaoLista,
  Turma,
} from "@/types";

export const mockUsers: Record<string, AuthSession> = {
  "professor@skillflow.dev": {
    access_token: "mock-access-token-professor",
    refresh_token: "mock-refresh-token-professor",
    user: {
      id: 1,
      email: "professor@skillflow.dev",
      nome: "Marina Souza",
      role: "PROFESSOR",
      must_change_password: false,
      escola_nome: "Colégio Horizonte",
    },
  },
  "coordenador@skillflow.dev": {
    access_token: "mock-access-token-coordenador",
    refresh_token: "mock-refresh-token-coordenador",
    user: {
      id: 2,
      email: "coordenador@skillflow.dev",
      nome: "Henrique Lopes",
      role: "COORDENADOR",
      must_change_password: false,
      escola_id: 1,
      escola_nome: "Colégio Horizonte",
    },
  },
  "novato@skillflow.dev": {
    access_token: "mock-access-token-novato",
    refresh_token: "mock-refresh-token-novato",
    user: {
      id: 3,
      email: "novato@skillflow.dev",
      nome: "Professor Novato",
      role: "PROFESSOR",
      must_change_password: true,
      escola_nome: "Colégio Horizonte",
    },
  },
};

export const mockAluno: AuthUser = {
  id: 99,
  email: "aluno@skillflow.dev",
  nome: "Aluno Teste",
  role: "ALUNO",
  must_change_password: false,
  turma_id: 10,
};

export const mockTurmas: Turma[] = [
  {
    id: 10,
    nome: "9º Ano A",
    escola_id: 1,
    escola_nome: "Colégio Horizonte",
    total_alunos: 32,
    total_atividades: 12,
    ranking_pontuacao_ativo: true,
    ranking_provas_ativo: false,
  },
  {
    id: 11,
    nome: "9º Ano B",
    escola_id: 1,
    escola_nome: "Colégio Horizonte",
    total_alunos: 28,
    total_atividades: 9,
    ranking_pontuacao_ativo: false,
    ranking_provas_ativo: false,
  },
  {
    id: 12,
    nome: "8º Ano C",
    escola_id: 1,
    escola_nome: "Colégio Horizonte",
    total_alunos: 30,
    total_atividades: 7,
    ranking_pontuacao_ativo: true,
    ranking_provas_ativo: true,
  },
];

export const mockAlunos: AlunoResumo[] = Array.from({ length: 12 }).map(
  (_, idx) => ({
    id: 100 + idx,
    nome:
      [
        "Ana Beatriz",
        "Bruno Cardoso",
        "Camila Duarte",
        "Diego Estêvão",
        "Eduarda Faria",
        "Felipe Gomes",
        "Giovana Helena",
        "Henrique Igor",
        "Isabela Jobim",
        "João Paulo",
        "Karen Lima",
        "Lucas Martins",
      ][idx] ?? `Aluno ${idx}`,
    email: `aluno${idx + 1}@skillflow.dev`,
    turma_id: 10 + (idx % 3),
    turma_nome: ["9º Ano A", "9º Ano B", "8º Ano C"][idx % 3],
    media_geral: 60 + ((idx * 7) % 40),
  }),
);

export const mockProfessores: ProfessorResumo[] = [
  {
    id: 200,
    nome: "Marina Souza",
    email: "professor@skillflow.dev",
    turmas: [
      { id: 10, nome: "9º Ano A" },
      { id: 11, nome: "9º Ano B" },
    ],
  },
  {
    id: 201,
    nome: "Carlos Mendes",
    email: "carlos@skillflow.dev",
    turmas: [{ id: 12, nome: "8º Ano C" }],
  },
];

export const mockResponsaveis: ResponsavelResumo[] = [
  {
    id: 300,
    nome: "Patrícia Albuquerque",
    email: "patricia.alb@skillflow.dev",
    alunos: [{ id: 100, nome: "Ana Beatriz", turma_nome: "9º Ano A" }],
  },
  {
    id: 301,
    nome: "Roberto Tavares",
    email: "roberto.tv@skillflow.dev",
    alunos: [
      { id: 101, nome: "Bruno Cardoso", turma_nome: "9º Ano B" },
      { id: 105, nome: "Felipe Gomes", turma_nome: "9º Ano B" },
    ],
  },
];

export const mockAtividades: Atividade[] = [
  {
    id: 500,
    titulo: "Revolução Industrial",
    disciplina: "História",
    tipo_atividade: "EXERCICIO",
    peso: 1,
    status_publicacao: "PUBLICADO",
    data_liberacao: "2026-04-01T13:00:00Z",
    data_limite: "2026-04-30T22:00:00Z",
    turma_id: 10,
    turma_nome: "9º Ano A",
    total_alunos: 32,
    total_submissoes: 28,
    exercicios: [
      {
        id: 1,
        ordem: 1,
        tipo: "MULTIPLA_ESCOLHA",
        enunciado: "Em qual país a Revolução Industrial teve início?",
        gabarito_esperado: "B",
        alternativas: [
          { letra: "A", texto: "França" },
          { letra: "B", texto: "Inglaterra" },
          { letra: "C", texto: "Alemanha" },
          { letra: "D", texto: "Estados Unidos" },
          { letra: "E", texto: "Brasil" },
        ],
      },
      {
        id: 2,
        ordem: 2,
        tipo: "DISSERTATIVA_TEXTO",
        enunciado: "Explique a relação entre Revolução Industrial e urbanização.",
        gabarito_esperado:
          "Esperar resposta abordando êxodo rural, formação das cidades operárias e novas relações de trabalho.",
        alternativas: null,
      },
      {
        id: 3,
        ordem: 3,
        tipo: "DISSERTATIVA",
        enunciado:
          "Anexe em PDF a linha do tempo das principais invenções (1750-1850).",
        gabarito_esperado:
          "Verificar se a linha do tempo cita máquina a vapor, tear mecânico e locomotiva.",
        alternativas: null,
      },
    ],
  },
  {
    id: 501,
    titulo: "Prova Bimestral - Funções",
    disciplina: "Matemática",
    tipo_atividade: "PROVA",
    peso: 4,
    status_publicacao: "PUBLICADO",
    data_liberacao: "2026-04-15T13:00:00Z",
    data_limite: "2026-05-05T22:00:00Z",
    turma_id: 10,
    turma_nome: "9º Ano A",
    total_alunos: 32,
    total_submissoes: 32,
    exercicios: [],
  },
  {
    id: 502,
    titulo: "Interpretação de texto - Poesia Modernista",
    disciplina: "Português",
    tipo_atividade: "EXERCICIO",
    peso: 1,
    status_publicacao: "DRAFT",
    data_liberacao: null,
    data_limite: null,
    turma_id: 11,
    turma_nome: "9º Ano B",
    total_alunos: 28,
    total_submissoes: 0,
    exercicios: [],
  },
];

export const mockSubmissoes: SubmissaoLista[] = [
  {
    id: 9001,
    aluno_id: 100,
    aluno_nome: "Ana Beatriz",
    atividade_id: 500,
    atividade_titulo: "Revolução Industrial",
    atividade_tipo: "EXERCICIO",
    exercicio_id: 1,
    exercicio_ordem: 1,
    exercicio_tipo: "MULTIPLA_ESCOLHA",
    nota_calculada: 100,
    nota_final: 100,
    status: "CORRIGIDA",
    turma_id: 10,
    turma_nome: "9º Ano A",
  },
  {
    id: 9002,
    aluno_id: 100,
    aluno_nome: "Ana Beatriz",
    atividade_id: 500,
    atividade_titulo: "Revolução Industrial",
    atividade_tipo: "EXERCICIO",
    exercicio_id: 2,
    exercicio_ordem: 2,
    exercicio_tipo: "DISSERTATIVA",
    nota_calculada: 78,
    nota_final: 85,
    status: "REVISADA_PROFESSOR",
    turma_id: 10,
    turma_nome: "9º Ano A",
  },
  {
    id: 9003,
    aluno_id: 101,
    aluno_nome: "Bruno Cardoso",
    atividade_id: 501,
    atividade_titulo: "Prova Bimestral - Funções",
    atividade_tipo: "PROVA",
    exercicio_id: 11,
    exercicio_ordem: 1,
    exercicio_tipo: "DISSERTATIVA",
    nota_calculada: null,
    nota_final: null,
    status: "EM_PROCESSAMENTO",
    turma_id: 10,
    turma_nome: "9º Ano A",
  },
];

export const mockSubmissaoDetalhe: SubmissaoDetalhe = {
  ...mockSubmissoes[1],
  enunciado: "Explique a relação entre Revolução Industrial e urbanização.",
  gabarito:
    "Resposta deve abordar êxodo rural, surgimento de cidades operárias e novas relações de trabalho.",
  resposta_texto:
    "A Revolução Industrial fez com que muitas pessoas saíssem do campo e fossem para as cidades em busca de emprego nas fábricas, gerando crescimento urbano desorganizado.",
  pdf_url: null,
  feedback_ia:
    "Boa associação entre êxodo rural e crescimento urbano. Faltou citar o impacto nas condições de trabalho.",
  feedback_professor:
    "Resposta correta, mas poderia citar o cortiço e a formação da classe operária.",
  nota_professor_override: 85,
};

export const mockAnalytics: AnalyticsTurma = {
  turma_id: 10,
  turma_nome: "9º Ano A",
  por_categoria_erro: [
    { categoria: "Interpretação de Texto", total: 18 },
    { categoria: "Cálculo Algébrico", total: 12 },
    { categoria: "Concordância Verbal", total: 9 },
    { categoria: "Conceitos Históricos", total: 6 },
  ],
  por_disciplina: [
    { disciplina: "Português", media: 78 },
    { disciplina: "Matemática", media: 65 },
    { disciplina: "História", media: 81 },
    { disciplina: "Ciências", media: 72 },
  ],
  alunos_em_risco: [
    { aluno_id: 102, aluno_nome: "Camila Duarte", media: 48 },
    { aluno_id: 105, aluno_nome: "Felipe Gomes", media: 52 },
    { aluno_id: 108, aluno_nome: "Isabela Jobim", media: 55 },
  ],
};
