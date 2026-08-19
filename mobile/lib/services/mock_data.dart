/// Conjunto de mocks para desenvolvimento sem backend real.
///
/// Os mocks foram pensados para acompanhar os contratos descritos em
/// `TechSpecs.md`, permitindo navegar pelo app antes da API estar disponível.
library;

final mockUsers = <String, Map<String, dynamic>>{
  'aluno@skillflow.dev': {
    'access_token': 'mock-aluno-access',
    'refresh_token': 'mock-aluno-refresh',
    'user': {
      'id': 100,
      'email': 'aluno@skillflow.dev',
      'nome': 'Ana Beatriz',
      'role': 'ALUNO',
      'must_change_password': false,
      'turma_id': 10,
      'turma_nome': '9º Ano A',
    },
  },
  'novato@skillflow.dev': {
    'access_token': 'mock-novato-access',
    'refresh_token': 'mock-novato-refresh',
    'user': {
      'id': 110,
      'email': 'novato@skillflow.dev',
      'nome': 'Aluno Novato',
      'role': 'ALUNO',
      'must_change_password': true,
      'turma_id': 10,
      'turma_nome': '9º Ano A',
    },
  },
  'pais@skillflow.dev': {
    'access_token': 'mock-pais-access',
    'refresh_token': 'mock-pais-refresh',
    'user': {
      'id': 300,
      'email': 'pais@skillflow.dev',
      'nome': 'Patrícia Almeida',
      'role': 'RESPONSAVEL',
      'must_change_password': false,
      'escola_id': 1,
      'escola_nome': 'Colégio Horizonte',
    },
  },
};

final mockPainel = <String, dynamic>{
  'media_geral': 82.5,
  'progresso_disciplinas': [
    {'disciplina': 'Português', 'media': 88.0},
    {'disciplina': 'Matemática', 'media': 74.5},
    {'disciplina': 'História', 'media': 90.0},
    {'disciplina': 'Ciências', 'media': 78.0},
  ],
  'historico': [
    {
      'atividade_id': 500,
      'titulo': 'Revolução Industrial',
      'disciplina': 'História',
      'nota': 92,
      'data': '2026-04-12T18:00:00Z',
      'tipo': 'EXERCICIO',
    },
    {
      'atividade_id': 501,
      'titulo': 'Prova de Funções',
      'disciplina': 'Matemática',
      'nota': 71,
      'data': '2026-04-19T16:00:00Z',
      'tipo': 'PROVA',
    },
    {
      'atividade_id': 502,
      'titulo': 'Crônica - Modernismo',
      'disciplina': 'Português',
      'nota': 88,
      'data': '2026-04-22T16:00:00Z',
      'tipo': 'EXERCICIO',
    },
  ],
  'atividades_pendentes': 2,
  'atividades_concluidas': 8,
};

final mockAtividades = <Map<String, dynamic>>[
  {
    'id': 600,
    'titulo': 'Sintaxe da oração subordinada',
    'disciplina': 'Português',
    'tipo_atividade': 'EXERCICIO',
    'peso': 1,
    'data_liberacao': '2026-04-15T13:00:00Z',
    'data_limite': '2026-05-12T22:00:00Z',
    'updated_at': '2026-04-20T10:00:00Z',
    'exercicios': [
      {
        'id': 6001,
        'ordem': 1,
        'tipo': 'MULTIPLA_ESCOLHA',
        'enunciado':
            'Em "Quando ele chegou, o jogo já tinha começado", a oração destacada classifica-se como:',
        'alternativas': [
          {'letra': 'A', 'texto': 'Substantiva subjetiva'},
          {'letra': 'B', 'texto': 'Adverbial temporal'},
          {'letra': 'C', 'texto': 'Adjetiva restritiva'},
          {'letra': 'D', 'texto': 'Substantiva objetiva direta'},
          {'letra': 'E', 'texto': 'Adverbial causal'},
        ],
      },
      {
        'id': 6002,
        'ordem': 2,
        'tipo': 'DISSERTATIVA_TEXTO',
        'enunciado':
            'Explique a diferença entre orações subordinadas substantivas subjetivas e objetivas diretas, dando um exemplo de cada.',
        'alternativas': null,
      },
      {
        'id': 6003,
        'ordem': 3,
        'tipo': 'DISSERTATIVA',
        'enunciado':
            'Anexe um PDF com 3 frases extras analisadas, classificando cada oração subordinada.',
        'alternativas': null,
      },
    ],
  },
  {
    'id': 601,
    'titulo': 'Prova de Funções',
    'disciplina': 'Matemática',
    'tipo_atividade': 'PROVA',
    'peso': 4,
    'data_liberacao': '2026-04-15T13:00:00Z',
    'data_limite': '2026-05-05T22:00:00Z',
    'updated_at': '2026-04-21T09:00:00Z',
    'exercicios': [
      {
        'id': 6011,
        'ordem': 1,
        'tipo': 'MULTIPLA_ESCOLHA',
        'enunciado':
            'Para a função f(x)=x²+2x-3, qual o valor mínimo de f(x)?',
        'alternativas': [
          {'letra': 'A', 'texto': '-4'},
          {'letra': 'B', 'texto': '-3'},
          {'letra': 'C', 'texto': '-2'},
          {'letra': 'D', 'texto': '0'},
          {'letra': 'E', 'texto': '1'},
        ],
      },
      {
        'id': 6012,
        'ordem': 2,
        'tipo': 'DISSERTATIVA',
        'enunciado':
            'Determine os zeros de f(x)=x²-5x+6 e descreva o gráfico.',
        'alternativas': null,
      },
    ],
  },
];

final mockSubmissoes = <Map<String, dynamic>>[
  {
    'id': 9001,
    'exercicio_id': 6001,
    'atividade_id': 600,
    'resposta_texto': 'B',
    'pdf_url': null,
    'nota_calculada': 100,
    'nota_final': 100,
    'feedback_ia': null,
    'feedback_professor': null,
    'status': 'CORRIGIDA',
  },
];

final mockResultado = <String, dynamic>{
  'id': 9001,
  'exercicio_id': 6001,
  'atividade_id': 600,
  'titulo': 'Sintaxe da oração subordinada',
  'enunciado':
      'Em "Quando ele chegou, o jogo já tinha começado", a oração destacada classifica-se como:',
  'resposta_texto': 'B',
  'nota_calculada': 100,
  'nota_final': 100,
  'feedback_ia':
      'Você acertou! Oração subordinada adverbial temporal indica circunstância de tempo.',
  'feedback_professor': null,
  'status': 'CORRIGIDA',
};

final mockRanking = <String, dynamic>{
  'ativo': true,
  'itens': [
    {'posicao': 1, 'aluno_id': 100, 'aluno_nome': 'Ana Beatriz', 'pontuacao': 920.0},
    {'posicao': 2, 'aluno_id': 101, 'aluno_nome': 'Bruno Cardoso', 'pontuacao': 870.0},
    {'posicao': 3, 'aluno_id': 102, 'aluno_nome': 'Camila Duarte', 'pontuacao': 845.0},
    {'posicao': 4, 'aluno_id': 103, 'aluno_nome': 'Diego Estêvão', 'pontuacao': 822.5},
    {'posicao': 5, 'aluno_id': 104, 'aluno_nome': 'Eduarda Faria', 'pontuacao': 805.0},
  ],
};

final mockRankingDesativado = <String, dynamic>{
  'ativo': false,
  'mensagem': 'O ranking está desativado para esta turma',
};

final mockFilhos = <Map<String, dynamic>>[
  {
    'id': 100,
    'nome': 'Ana Beatriz',
    'turma_nome': '9º Ano A',
    'escola_nome': 'Colégio Horizonte',
  },
  {
    'id': 105,
    'nome': 'Felipe Almeida',
    'turma_nome': '9º Ano B',
    'escola_nome': 'Colégio Horizonte',
  },
];

final mockBoletim = <String, dynamic>{
  'media_geral': 84.0,
  'itens': [
    {
      'atividade_id': 500,
      'titulo': 'Revolução Industrial',
      'disciplina': 'História',
      'nota': 92.0,
      'peso': 1,
      'data': '2026-04-12T18:00:00Z',
      'tipo': 'EXERCICIO',
    },
    {
      'atividade_id': 501,
      'titulo': 'Prova de Funções',
      'disciplina': 'Matemática',
      'nota': 71.0,
      'peso': 4,
      'data': '2026-04-19T16:00:00Z',
      'tipo': 'PROVA',
    },
    {
      'atividade_id': 502,
      'titulo': 'Crônica Modernista',
      'disciplina': 'Português',
      'nota': 88.0,
      'peso': 1,
      'data': '2026-04-22T16:00:00Z',
      'tipo': 'EXERCICIO',
    },
  ],
};

final mockServerTime = <String, dynamic>{
  'server_time': DateTime.now().toUtc().toIso8601String(),
};
