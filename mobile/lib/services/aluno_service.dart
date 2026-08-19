import 'dart:typed_data';

import '../config/env.dart';
import '../models/atividade.dart';
import '../models/ranking.dart';
import '../models/submissao.dart';
import 'api_client.dart';
import 'api_exception.dart';
import 'mock_data.dart';

class AlunoService {
  final ApiClient _client;

  AlunoService({ApiClient? client}) : _client = client ?? ApiClient();

  Future<DateTime> getServerTime() async {
    if (Env.useMocks) {
      return DateTime.now().toUtc();
    }
    final raw = await _client.get('/api/app/sync/server-time/');
    return DateTime.parse(raw['server_time'] as String);
  }

  Future<PainelAluno> getPainel() async {
    if (Env.useMocks) {
      await Future<void>.delayed(const Duration(milliseconds: 220));
      return PainelAluno.fromJson(mockPainel);
    }
    final raw = await _client.get('/api/app/painel/');
    return PainelAluno.fromJson(raw as Map<String, dynamic>);
  }

  Future<List<Atividade>> listAtividades({
    AtividadeTipo? tipo,
    bool? feitos,
  }) async {
    if (Env.useMocks) {
      await Future<void>.delayed(const Duration(milliseconds: 220));
      var data = mockAtividades.map(Atividade.fromJson).toList();
      if (tipo != null) {
        data = data.where((a) => a.tipo == tipo).toList();
      }
      if (feitos != null) {
        data = data.where((a) => a.isCompleted == feitos).toList();
      }
      return data;
    }
    final raw = await _client.get(
      '/api/app/atividades/',
      query: {
        if (tipo != null) 'tipo': atividadeTipoToString(tipo),
        if (feitos != null) 'feitos': feitos.toString(),
      },
    );
    final results = (raw as Map<String, dynamic>)['results'] as List<dynamic>;
    return results
        .map((e) => Atividade.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Lista submissões já feitas pelo aluno na atividade [atividadeId].
  /// Útil no início da tentativa para pular automaticamente exercícios
  /// que o aluno já respondeu (e evitar 409 do backend).
  Future<List<Submissao>> listSubmissoesAtividade(int atividadeId) async {
    if (Env.useMocks) {
      await Future<void>.delayed(const Duration(milliseconds: 120));
      return mockSubmissoes
          .where((s) => s['atividade_id'] == atividadeId)
          .map((s) => Submissao.fromJson(s))
          .toList();
    }
    final raw = await _client.get(
      '/api/app/submissoes/',
      query: {'atividade_id': atividadeId.toString()},
    );
    final list = raw as List<dynamic>;
    return list
        .map((e) => Submissao.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Atividade> getAtividade(int id) async {
    if (Env.useMocks) {
      await Future<void>.delayed(const Duration(milliseconds: 200));
      final raw = mockAtividades.firstWhere(
        (a) => a['id'] == id,
        orElse: () => mockAtividades.first,
      );
      return Atividade.fromJson(raw);
    }
    // The backend exposes the activity exercises as a flat list. We rebuild
    // a thin Atividade payload so the rest of the UI can stay agnostic.
    final exerciciosRaw = await _client
        .get('/api/app/atividades/$id/exercicios/') as List<dynamic>;
    final atividades = await listAtividades();
    final atividade = atividades.firstWhere(
      (a) => a.id == id,
      orElse: () => atividades.isNotEmpty
          ? atividades.first
          : Atividade(
              id: id,
              titulo: 'Atividade #$id',
              disciplina: '',
              tipo: AtividadeTipo.exercicio,
              peso: 1,
              exercicios: const [],
            ),
    );
    final exercicios = exerciciosRaw
        .whereType<Map<String, dynamic>>()
        .map(Exercicio.fromJson)
        .toList();
    return Atividade(
      id: atividade.id,
      titulo: atividade.titulo,
      disciplina: atividade.disciplina,
      tipo: atividade.tipo,
      peso: atividade.peso,
      dataLiberacao: atividade.dataLiberacao,
      dataLimite: atividade.dataLimite,
      updatedAt: atividade.updatedAt,
      exercicios: exercicios,
    );
  }

  Future<Submissao> submeterMC({
    required int exercicioId,
    required int atividadeId,
    required String letra,
    DateTime? timestampLocal,
    int? clientServerOffsetMs,
    DateTime? serverTimeSnapshot,
    DateTime? atividadeUpdatedAtSnapshot,
  }) async {
    if (Env.useMocks) {
      await Future<void>.delayed(const Duration(milliseconds: 200));
      final correto = letra.toUpperCase() == 'B';
      return Submissao(
        id: DateTime.now().millisecondsSinceEpoch,
        exercicioId: exercicioId,
        atividadeId: atividadeId,
        respostaTexto: letra,
        notaCalculada: correto ? 100 : 0,
        notaFinal: correto ? 100 : 0,
        status: SubmissaoStatus.corrigida,
      );
    }
    // The backend `/api/app/submissoes/` endpoint expects multipart/form-data
    // so the same handler can accept dissertativa PDFs too. We send all fields
    // as form fields even when there's no PDF. The response uses the
    // `SubmissaoOnlineCreatedOut` schema (`submissao_id`, `status`, ...),
    // not the full `Submissao` shape — hence `fromCreatedJson`.
    final raw = await _client.postFormFields(
      '/api/app/submissoes/',
      fields: {
        'exercicio_id': exercicioId.toString(),
        'resposta_texto': letra,
        if (timestampLocal != null)
          'timestamp_local': timestampLocal.toIso8601String(),
        if (clientServerOffsetMs != null)
          'client_server_offset_ms': clientServerOffsetMs.toString(),
        if (serverTimeSnapshot != null)
          'server_time_snapshot': serverTimeSnapshot.toIso8601String(),
        if (atividadeUpdatedAtSnapshot != null)
          'atividade_updated_at_snapshot':
              atividadeUpdatedAtSnapshot.toIso8601String(),
      },
    );
    return Submissao.fromCreatedJson(
      raw as Map<String, dynamic>,
      exercicioId: exercicioId,
      atividadeId: atividadeId,
      respostaTexto: letra,
    );
  }

  /// Envia uma resposta dissertativa **digitada** (sem anexo PDF).
  ///
  /// Usada pelo tipo `DISSERTATIVA_TEXTO`. Mesmo endpoint multipart do
  /// backend (`/api/app/submissoes/`) — só não enviamos o campo `pdf`.
  /// O servidor identifica o tipo do exercício e roteia para o pipeline
  /// assíncrono de correção (IA + revisão).
  Future<Submissao> submeterDissertativaTexto({
    required int exercicioId,
    required int atividadeId,
    required String texto,
    DateTime? timestampLocal,
    int? clientServerOffsetMs,
    DateTime? serverTimeSnapshot,
    DateTime? atividadeUpdatedAtSnapshot,
  }) async {
    if (Env.useMocks) {
      await Future<void>.delayed(const Duration(milliseconds: 320));
      return Submissao(
        id: DateTime.now().millisecondsSinceEpoch,
        exercicioId: exercicioId,
        atividadeId: atividadeId,
        respostaTexto: texto,
        status: SubmissaoStatus.emProcessamento,
      );
    }
    final raw = await _client.postFormFields(
      '/api/app/submissoes/',
      fields: {
        'exercicio_id': exercicioId.toString(),
        'resposta_texto': texto,
        if (timestampLocal != null)
          'timestamp_local': timestampLocal.toIso8601String(),
        if (clientServerOffsetMs != null)
          'client_server_offset_ms': clientServerOffsetMs.toString(),
        if (serverTimeSnapshot != null)
          'server_time_snapshot': serverTimeSnapshot.toIso8601String(),
        if (atividadeUpdatedAtSnapshot != null)
          'atividade_updated_at_snapshot':
              atividadeUpdatedAtSnapshot.toIso8601String(),
      },
    );
    return Submissao.fromCreatedJson(
      raw as Map<String, dynamic>,
      exercicioId: exercicioId,
      atividadeId: atividadeId,
      respostaTexto: texto,
    );
  }

  /// Envia uma resposta dissertativa em PDF.
  ///
  /// Recebe [pdfBytes] (lidos via `FilePicker.pickFiles(withData: true)` ou
  /// `XFile.readAsBytes()` no Web) + [filename]. Use sempre essa assinatura
  /// — ela funciona em **todas as plataformas**, inclusive Flutter Web,
  /// onde `File.path` é nulo e não dá pra ler do disco.
  Future<Submissao> submeterDissertativa({
    required int exercicioId,
    required int atividadeId,
    required Uint8List pdfBytes,
    required String filename,
    DateTime? timestampLocal,
    int? clientServerOffsetMs,
    DateTime? serverTimeSnapshot,
    DateTime? atividadeUpdatedAtSnapshot,
  }) async {
    if (Env.useMocks) {
      await Future<void>.delayed(const Duration(milliseconds: 320));
      return Submissao(
        id: DateTime.now().millisecondsSinceEpoch,
        exercicioId: exercicioId,
        atividadeId: atividadeId,
        pdfUrl: 'mock://$filename',
        status: SubmissaoStatus.emProcessamento,
      );
    }
    final raw = await _client.uploadMultipartBytes(
      '/api/app/submissoes/',
      bytes: pdfBytes,
      filename: filename.toLowerCase().endsWith('.pdf')
          ? filename
          : '$filename.pdf',
      fileField: 'pdf',
      fields: {
        'exercicio_id': exercicioId.toString(),
        if (timestampLocal != null)
          'timestamp_local': timestampLocal.toIso8601String(),
        if (clientServerOffsetMs != null)
          'client_server_offset_ms': clientServerOffsetMs.toString(),
        if (serverTimeSnapshot != null)
          'server_time_snapshot': serverTimeSnapshot.toIso8601String(),
        if (atividadeUpdatedAtSnapshot != null)
          'atividade_updated_at_snapshot':
              atividadeUpdatedAtSnapshot.toIso8601String(),
      },
    );
    return Submissao.fromCreatedJson(
      raw as Map<String, dynamic>,
      exercicioId: exercicioId,
      atividadeId: atividadeId,
    );
  }

  Future<Map<String, dynamic>> getResultado(int submissaoId) async {
    if (Env.useMocks) {
      await Future<void>.delayed(const Duration(milliseconds: 220));
      return mockResultado;
    }
    final raw =
        await _client.get('/api/app/submissoes/$submissaoId/resultado/');
    return raw as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> chat({
    required int submissaoId,
    required String mensagem,
    required int contadorAtual,
  }) async {
    if (Env.useMocks) {
      await Future<void>.delayed(const Duration(milliseconds: 280));
      if (contadorAtual >= 3) {
        throw ApiException(403, 'Limite de mensagens atingido.');
      }
      return {
        'resposta':
            'Mensagem do tutor IA simulando análise didática para a sua dúvida.',
        'contador_mensagens_aluno': contadorAtual + 1,
      };
    }
    final raw =
        await _client.post('/api/app/submissoes/$submissaoId/chat/', {
      'mensagem': mensagem,
    });
    return raw as Map<String, dynamic>;
  }

  Future<Ranking> getRanking({required String tipo}) async {
    if (Env.useMocks) {
      await Future<void>.delayed(const Duration(milliseconds: 200));
      return Ranking.fromJson(
        tipo == 'provas' ? mockRankingDesativado : mockRanking,
      );
    }
    final raw = await _client.get(
      '/api/app/turma/ranking/',
      query: {'tipo': tipo},
    );
    return Ranking.fromJson(raw as Map<String, dynamic>);
  }
}
