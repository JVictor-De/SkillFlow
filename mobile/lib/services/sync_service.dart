import 'dart:convert';
import 'dart:io';

import 'package:sqflite/sqflite.dart';

import '../models/atividade.dart';
import 'aluno_service.dart';
import 'api_exception.dart';
import 'local_database.dart';

/// Serviço de sincronização offline-first.
///
/// 1. Calcula o offset entre o relógio do cliente e do servidor.
/// 2. Baixa atividades + exercícios disponíveis para a turma do aluno.
/// 3. Envia submissões pendentes carimbadas com `timestamp_local`,
///    `server_time_snapshot`, `client_server_offset_ms` e
///    `atividade_updated_at_snapshot`.
class SyncService {
  final LocalDatabase _localDb;
  final AlunoService _alunoService;

  int _clientServerOffsetMs = 0;
  DateTime _lastServerTime = DateTime.now().toUtc();

  SyncService({
    LocalDatabase? localDb,
    AlunoService? alunoService,
  })  : _localDb = localDb ?? LocalDatabase(),
        _alunoService = alunoService ?? AlunoService();

  int get clientServerOffsetMs => _clientServerOffsetMs;
  DateTime get lastServerTime => _lastServerTime;

  Future<void> calculateOffset({DateTime Function()? now}) async {
    final clientNow = (now ?? DateTime.now)().toUtc();
    final serverNow = await _alunoService.getServerTime();
    _lastServerTime = serverNow;
    _clientServerOffsetMs =
        serverNow.millisecondsSinceEpoch - clientNow.millisecondsSinceEpoch;
  }

  Future<void> downloadAtividades() async {
    final atividades = await _alunoService.listAtividades();
    final db = await _localDb.database;
    final batch = db.batch();
    for (final atividade in atividades) {
      batch.insert(
        'atividade_local',
        LocalAtividade(
          id: atividade.id,
          payload: jsonEncode(atividade.toJson()),
          updatedAt: atividade.updatedAt ?? DateTime.now().toUtc(),
          serverTimeSnapshot: _lastServerTime,
          clientServerOffsetMs: _clientServerOffsetMs,
        ).toMap(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  Future<List<Atividade>> listAtividadesLocais() async {
    final db = await _localDb.database;
    final rows = await db.query('atividade_local', orderBy: 'updated_at DESC');
    return rows
        .map((row) => Atividade.fromJson(
              jsonDecode(row['payload'] as String) as Map<String, dynamic>,
            ))
        .toList();
  }

  Future<int> enqueueSubmissaoMC({
    required int exercicioId,
    required int atividadeId,
    required String letra,
    required DateTime atividadeUpdatedAt,
  }) async {
    final db = await _localDb.database;
    final now = DateTime.now().toUtc();
    return db.insert(
      'submissao_pendente',
      SubmissaoPendente(
        exercicioId: exercicioId,
        atividadeId: atividadeId,
        tipo: 'MC',
        respostaTexto: letra,
        timestampLocal: now,
        serverTimeSnapshot: _lastServerTime,
        clientServerOffsetMs: _clientServerOffsetMs,
        atividadeUpdatedAtSnapshot: atividadeUpdatedAt,
      ).toMap(),
    );
  }

  Future<int> enqueueSubmissaoPdf({
    required int exercicioId,
    required int atividadeId,
    required File pdf,
    required DateTime atividadeUpdatedAt,
  }) async {
    final db = await _localDb.database;
    final now = DateTime.now().toUtc();
    return db.insert(
      'submissao_pendente',
      SubmissaoPendente(
        exercicioId: exercicioId,
        atividadeId: atividadeId,
        tipo: 'DISSERTATIVA',
        pdfPath: pdf.path,
        timestampLocal: now,
        serverTimeSnapshot: _lastServerTime,
        clientServerOffsetMs: _clientServerOffsetMs,
        atividadeUpdatedAtSnapshot: atividadeUpdatedAt,
      ).toMap(),
    );
  }

  Future<List<SubmissaoPendente>> listPendentes() async {
    final db = await _localDb.database;
    final rows = await db.query(
      'submissao_pendente',
      where: 'sincronizado = 0',
      orderBy: 'timestamp_local ASC',
    );
    return rows.map(SubmissaoPendente.fromMap).toList();
  }

  Future<int> get pendentesCount async {
    final db = await _localDb.database;
    final result = await db.rawQuery(
      'SELECT COUNT(*) as total FROM submissao_pendente WHERE sincronizado = 0',
    );
    return (result.first['total'] as int?) ?? 0;
  }

  Future<void> sendPendentes() async {
    final pendentes = await listPendentes();
    final db = await _localDb.database;
    for (final pendente in pendentes) {
      try {
        if (pendente.tipo == 'MC') {
          await _alunoService.submeterMC(
            exercicioId: pendente.exercicioId,
            atividadeId: pendente.atividadeId,
            letra: pendente.respostaTexto ?? '',
            timestampLocal: pendente.timestampLocal,
            clientServerOffsetMs: pendente.clientServerOffsetMs,
            serverTimeSnapshot: pendente.serverTimeSnapshot,
            atividadeUpdatedAtSnapshot: pendente.atividadeUpdatedAtSnapshot,
          );
        } else if (pendente.pdfPath != null) {
          // Sync queue só roda em Android/iOS/desktop (sqflite + dart:io),
          // então é seguro reabrir o arquivo do disco para enviar.
          final file = File(pendente.pdfPath!);
          final bytes = await file.readAsBytes();
          final filename = pendente.pdfPath!.split(RegExp(r'[\\/]')).last;
          await _alunoService.submeterDissertativa(
            exercicioId: pendente.exercicioId,
            atividadeId: pendente.atividadeId,
            pdfBytes: bytes,
            filename: filename,
            timestampLocal: pendente.timestampLocal,
            clientServerOffsetMs: pendente.clientServerOffsetMs,
            serverTimeSnapshot: pendente.serverTimeSnapshot,
            atividadeUpdatedAtSnapshot: pendente.atividadeUpdatedAtSnapshot,
          );
        }
        await db.update(
          'submissao_pendente',
          {'sincronizado': 1, 'ultimo_status': 'OK'},
          where: 'id = ?',
          whereArgs: [pendente.id],
        );
      } on ApiException catch (err) {
        await db.update(
          'submissao_pendente',
          {
            'sincronizado': err.statusCode == 409 ? 1 : 0,
            'ultimo_status':
                err.statusCode == 409 ? 'CONFLITO_SYNC' : 'ERRO_${err.statusCode}',
          },
          where: 'id = ?',
          whereArgs: [pendente.id],
        );
      }
    }
  }
}
