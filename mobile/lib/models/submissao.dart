enum SubmissaoStatus {
  pendente,
  emProcessamento,
  corrigida,
  revisadaProfessor,
  conflitoSync,
}

SubmissaoStatus submissaoStatusFromString(String raw) {
  switch (raw.toUpperCase()) {
    case 'PENDENTE':
      return SubmissaoStatus.pendente;
    case 'EM_PROCESSAMENTO':
      return SubmissaoStatus.emProcessamento;
    case 'CORRIGIDA':
      return SubmissaoStatus.corrigida;
    case 'REVISADA_PROFESSOR':
      return SubmissaoStatus.revisadaProfessor;
    case 'CONFLITO_SYNC':
      return SubmissaoStatus.conflitoSync;
    default:
      return SubmissaoStatus.pendente;
  }
}

String submissaoStatusToString(SubmissaoStatus status) {
  switch (status) {
    case SubmissaoStatus.pendente:
      return 'PENDENTE';
    case SubmissaoStatus.emProcessamento:
      return 'EM_PROCESSAMENTO';
    case SubmissaoStatus.corrigida:
      return 'CORRIGIDA';
    case SubmissaoStatus.revisadaProfessor:
      return 'REVISADA_PROFESSOR';
    case SubmissaoStatus.conflitoSync:
      return 'CONFLITO_SYNC';
  }
}

class Submissao {
  final int id;
  final int exercicioId;
  final int atividadeId;
  final String? respostaTexto;
  final String? pdfUrl;
  final int? notaCalculada;
  final int? notaFinal;
  final String? feedbackIa;
  final String? feedbackProfessor;
  final SubmissaoStatus status;

  const Submissao({
    required this.id,
    required this.exercicioId,
    required this.atividadeId,
    required this.status,
    this.respostaTexto,
    this.pdfUrl,
    this.notaCalculada,
    this.notaFinal,
    this.feedbackIa,
    this.feedbackProfessor,
  });

  factory Submissao.fromJson(Map<String, dynamic> json) => Submissao(
        id: json['id'] as int,
        exercicioId: json['exercicio_id'] as int,
        atividadeId: json['atividade_id'] as int,
        status: submissaoStatusFromString(json['status'] as String),
        respostaTexto: json['resposta_texto'] as String?,
        pdfUrl: json['pdf_url'] as String?,
        notaCalculada: json['nota_calculada'] as int?,
        notaFinal: json['nota_final'] as int?,
        feedbackIa: json['feedback_ia'] as String?,
        feedbackProfessor: json['feedback_professor'] as String?,
      );

  /// Decoder do payload retornado por `POST /api/app/submissoes/`
  /// (schema `SubmissaoOnlineCreatedOut`). Só traz `submissao_id`,
  /// `status`, `nota_calculada`, `feedback_ia` e `correto` — os
  /// demais campos vêm do contexto local (exercício/atividade) ou
  /// só ficam disponíveis no GET de resultado.
  factory Submissao.fromCreatedJson(
    Map<String, dynamic> json, {
    required int exercicioId,
    required int atividadeId,
    String? respostaTexto,
  }) =>
      Submissao(
        id: json['submissao_id'] as int,
        exercicioId: exercicioId,
        atividadeId: atividadeId,
        status: submissaoStatusFromString(json['status'] as String),
        respostaTexto: respostaTexto,
        notaCalculada: json['nota_calculada'] as int?,
        notaFinal: json['nota_calculada'] as int?,
        feedbackIa: json['feedback_ia'] as String?,
      );
}

class PainelAluno {
  final double mediaGeral;
  final List<DisciplinaResumo> progressoDisciplinas;
  final List<HistoricoNota> historico;
  final int atividadesPendentes;
  final int atividadesConcluidas;

  const PainelAluno({
    required this.mediaGeral,
    required this.progressoDisciplinas,
    required this.historico,
    required this.atividadesPendentes,
    required this.atividadesConcluidas,
  });

  /// Aceita os dois formatos do backend:
  /// - `media_geral` / `progresso_disciplinas` / `historico` (mobile)
  /// - `media_geral_ponderada` / `progresso_por_disciplina` / `historico_notas`
  ///   (SaaS legado).
  ///
  /// Quando `media_geral_ponderada` chega `null` (aluno novo, sem turma ou
  /// sem submissões corrigidas), tratamos como `0` em vez de jogar
  /// `TypeError`. Isso era a causa do "Não foi possível carregar o painel".
  factory PainelAluno.fromJson(Map<String, dynamic> json) {
    final mediaRaw = json['media_geral'] ?? json['media_geral_ponderada'];
    final progresso = (json['progresso_disciplinas'] ??
            json['progresso_por_disciplina']) as List<dynamic>? ??
        const [];
    final historico =
        (json['historico'] ?? json['historico_notas']) as List<dynamic>? ??
            const [];
    return PainelAluno(
      mediaGeral: mediaRaw is num ? mediaRaw.toDouble() : 0.0,
      progressoDisciplinas: progresso
          .map((e) => DisciplinaResumo.fromJson(e as Map<String, dynamic>))
          .toList(),
      historico: historico
          .map((e) => HistoricoNota.fromJson(e as Map<String, dynamic>))
          .toList(),
      atividadesPendentes: json['atividades_pendentes'] as int? ?? 0,
      atividadesConcluidas: json['atividades_concluidas'] as int? ?? 0,
    );
  }
}

class DisciplinaResumo {
  final String disciplina;
  final double media;

  const DisciplinaResumo({required this.disciplina, required this.media});

  factory DisciplinaResumo.fromJson(Map<String, dynamic> json) =>
      DisciplinaResumo(
        disciplina: json['disciplina'] as String,
        media: (json['media'] as num).toDouble(),
      );
}

class HistoricoNota {
  final int atividadeId;
  final String titulo;
  final String disciplina;
  final double nota;
  final DateTime data;
  final String tipo;

  const HistoricoNota({
    required this.atividadeId,
    required this.titulo,
    required this.disciplina,
    required this.nota,
    required this.data,
    required this.tipo,
  });

  factory HistoricoNota.fromJson(Map<String, dynamic> json) => HistoricoNota(
        atividadeId: json['atividade_id'] as int,
        titulo: (json['titulo'] as String?) ?? '',
        disciplina: (json['disciplina'] as String?) ?? '',
        nota: (json['nota'] as num? ?? 0).toDouble(),
        data: DateTime.parse(json['data'] as String),
        tipo: (json['tipo'] as String?) ?? 'EXERCICIO',
      );
}
