enum AtividadeTipo { exercicio, prova }

AtividadeTipo atividadeTipoFromString(String raw) =>
    raw.toUpperCase() == 'PROVA' ? AtividadeTipo.prova : AtividadeTipo.exercicio;

String atividadeTipoToString(AtividadeTipo tipo) =>
    tipo == AtividadeTipo.prova ? 'PROVA' : 'EXERCICIO';

/// Tipos de questão suportados pelo SkillFlow.
///
/// - [multiplaEscolha]: aluno escolhe uma alternativa.
/// - [dissertativaTexto]: aluno digita a resposta na própria
///   plataforma/app.
/// - [dissertativa]: aluno anexa um PDF com a resposta (nome legado
///   mantido por compatibilidade com dados existentes; UI chama de
///   "Anexo (PDF)").
enum ExercicioTipo { multiplaEscolha, dissertativaTexto, dissertativa }

ExercicioTipo exercicioTipoFromString(String raw) {
  switch (raw.toUpperCase()) {
    case 'DISSERTATIVA':
      return ExercicioTipo.dissertativa;
    case 'DISSERTATIVA_TEXTO':
      return ExercicioTipo.dissertativaTexto;
    default:
      return ExercicioTipo.multiplaEscolha;
  }
}

String exercicioTipoToString(ExercicioTipo tipo) {
  switch (tipo) {
    case ExercicioTipo.multiplaEscolha:
      return 'MULTIPLA_ESCOLHA';
    case ExercicioTipo.dissertativaTexto:
      return 'DISSERTATIVA_TEXTO';
    case ExercicioTipo.dissertativa:
      return 'DISSERTATIVA';
  }
}

class Alternativa {
  final String letra;
  final String texto;

  const Alternativa({required this.letra, required this.texto});

  factory Alternativa.fromJson(Map<String, dynamic> json) => Alternativa(
        letra: json['letra'] as String,
        texto: json['texto'] as String,
      );

  Map<String, dynamic> toJson() => {'letra': letra, 'texto': texto};
}

/// Aceita ambos os shapes:
/// - lista `[{letra, texto}, ...]` (mocks/legado)
/// - dict `{"A": "texto", "B": "texto", ...}` (API real)
List<Alternativa> _alternativasFromJson(dynamic raw) {
  if (raw == null) return const [];
  if (raw is List) {
    return raw
        .whereType<Map<String, dynamic>>()
        .map(Alternativa.fromJson)
        .toList();
  }
  if (raw is Map) {
    final entries = raw.entries.toList()
      ..sort((a, b) => '${a.key}'.compareTo('${b.key}'));
    return entries
        .map((e) => Alternativa(letra: '${e.key}', texto: '${e.value ?? ''}'))
        .toList();
  }
  return const [];
}

class Exercicio {
  final int id;
  final int ordem;
  final ExercicioTipo tipo;
  final String enunciado;
  final List<Alternativa> alternativas;

  const Exercicio({
    required this.id,
    required this.ordem,
    required this.tipo,
    required this.enunciado,
    required this.alternativas,
  });

  factory Exercicio.fromJson(Map<String, dynamic> json) => Exercicio(
        id: json['id'] as int,
        ordem: json['ordem'] as int,
        tipo: exercicioTipoFromString(json['tipo'] as String),
        enunciado: json['enunciado'] as String,
        alternativas: _alternativasFromJson(json['alternativas']),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'ordem': ordem,
        'tipo': exercicioTipoToString(tipo),
        'enunciado': enunciado,
        'alternativas': alternativas.map((a) => a.toJson()).toList(),
      };
}

class Atividade {
  final int id;
  final String titulo;
  final String disciplina;
  final AtividadeTipo tipo;
  final int peso;
  final DateTime? dataLiberacao;
  final DateTime? dataLimite;
  final DateTime? updatedAt;
  final List<Exercicio> exercicios;

  /// Indica se o aluno logado já enviou submissão para todos os
  /// exercícios desta atividade. Backend: `is_completed`.
  final bool isCompleted;

  /// Quantidade de exercícios desta atividade que o aluno já enviou.
  /// Backend: `qtd_submetidos`.
  final int qtdSubmetidos;

  const Atividade({
    required this.id,
    required this.titulo,
    required this.disciplina,
    required this.tipo,
    required this.peso,
    required this.exercicios,
    this.dataLiberacao,
    this.dataLimite,
    this.updatedAt,
    this.isCompleted = false,
    this.qtdSubmetidos = 0,
  });

  factory Atividade.fromJson(Map<String, dynamic> json) => Atividade(
        id: json['id'] as int,
        titulo: json['titulo'] as String,
        disciplina: json['disciplina'] as String,
        tipo: atividadeTipoFromString(json['tipo_atividade'] as String),
        peso: (json['peso'] as int?) ?? 1,
        dataLiberacao: _date(json['data_liberacao']),
        dataLimite: _date(json['data_limite']),
        updatedAt: _date(json['updated_at']),
        exercicios:
            ((json['exercicios'] as List<dynamic>?) ?? const [])
                .map((e) => Exercicio.fromJson(e as Map<String, dynamic>))
                .toList(),
        isCompleted: (json['is_completed'] as bool?) ?? false,
        qtdSubmetidos: (json['qtd_submetidos'] as int?) ?? 0,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'titulo': titulo,
        'disciplina': disciplina,
        'tipo_atividade': atividadeTipoToString(tipo),
        'peso': peso,
        'data_liberacao': dataLiberacao?.toIso8601String(),
        'data_limite': dataLimite?.toIso8601String(),
        'updated_at': updatedAt?.toIso8601String(),
        'exercicios': exercicios.map((e) => e.toJson()).toList(),
        'is_completed': isCompleted,
        'qtd_submetidos': qtdSubmetidos,
      };

  bool get expirado =>
      dataLimite != null && DateTime.now().isAfter(dataLimite!);
}

DateTime? _date(dynamic value) {
  if (value == null) return null;
  return DateTime.tryParse(value as String);
}
