import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

/// Camada fina sobre o SQLite local. Mantém atividades, exercícios e
/// uma fila de submissões pendentes no dispositivo do aluno.
class LocalDatabase {
  static const _dbName = 'skillflow.db';
  static const _dbVersion = 1;

  Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _open();
    return _database!;
  }

  Future<Database> _open() async {
    final dir = await getDatabasesPath();
    final path = join(dir, _dbName);
    return openDatabase(
      path,
      version: _dbVersion,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE atividade_local (
            id INTEGER PRIMARY KEY,
            payload TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            server_time_snapshot TEXT NOT NULL,
            client_server_offset_ms INTEGER NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE submissao_pendente (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exercicio_id INTEGER NOT NULL,
            atividade_id INTEGER NOT NULL,
            tipo TEXT NOT NULL,
            resposta_texto TEXT,
            pdf_path TEXT,
            timestamp_local TEXT NOT NULL,
            server_time_snapshot TEXT NOT NULL,
            client_server_offset_ms INTEGER NOT NULL,
            atividade_updated_at_snapshot TEXT,
            sincronizado INTEGER NOT NULL DEFAULT 0,
            ultimo_status TEXT
          )
        ''');
      },
    );
  }

  Future<void> close() async {
    await _database?.close();
    _database = null;
  }
}

class LocalAtividade {
  final int id;
  final String payload;
  final DateTime updatedAt;
  final DateTime serverTimeSnapshot;
  final int clientServerOffsetMs;

  const LocalAtividade({
    required this.id,
    required this.payload,
    required this.updatedAt,
    required this.serverTimeSnapshot,
    required this.clientServerOffsetMs,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'payload': payload,
        'updated_at': updatedAt.toIso8601String(),
        'server_time_snapshot': serverTimeSnapshot.toIso8601String(),
        'client_server_offset_ms': clientServerOffsetMs,
      };

  factory LocalAtividade.fromMap(Map<String, dynamic> map) => LocalAtividade(
        id: map['id'] as int,
        payload: map['payload'] as String,
        updatedAt: DateTime.parse(map['updated_at'] as String),
        serverTimeSnapshot:
            DateTime.parse(map['server_time_snapshot'] as String),
        clientServerOffsetMs: map['client_server_offset_ms'] as int,
      );
}

class SubmissaoPendente {
  final int? id;
  final int exercicioId;
  final int atividadeId;
  final String tipo; // 'MC' | 'DISSERTATIVA'
  final String? respostaTexto;
  final String? pdfPath;
  final DateTime timestampLocal;
  final DateTime serverTimeSnapshot;
  final int clientServerOffsetMs;
  final DateTime? atividadeUpdatedAtSnapshot;
  final bool sincronizado;
  final String? ultimoStatus;

  const SubmissaoPendente({
    required this.exercicioId,
    required this.atividadeId,
    required this.tipo,
    required this.timestampLocal,
    required this.serverTimeSnapshot,
    required this.clientServerOffsetMs,
    this.id,
    this.respostaTexto,
    this.pdfPath,
    this.atividadeUpdatedAtSnapshot,
    this.sincronizado = false,
    this.ultimoStatus,
  });

  Map<String, dynamic> toMap() => {
        'exercicio_id': exercicioId,
        'atividade_id': atividadeId,
        'tipo': tipo,
        'resposta_texto': respostaTexto,
        'pdf_path': pdfPath,
        'timestamp_local': timestampLocal.toIso8601String(),
        'server_time_snapshot': serverTimeSnapshot.toIso8601String(),
        'client_server_offset_ms': clientServerOffsetMs,
        'atividade_updated_at_snapshot':
            atividadeUpdatedAtSnapshot?.toIso8601String(),
        'sincronizado': sincronizado ? 1 : 0,
        'ultimo_status': ultimoStatus,
      };

  factory SubmissaoPendente.fromMap(Map<String, dynamic> map) =>
      SubmissaoPendente(
        id: map['id'] as int?,
        exercicioId: map['exercicio_id'] as int,
        atividadeId: map['atividade_id'] as int,
        tipo: map['tipo'] as String,
        respostaTexto: map['resposta_texto'] as String?,
        pdfPath: map['pdf_path'] as String?,
        timestampLocal: DateTime.parse(map['timestamp_local'] as String),
        serverTimeSnapshot:
            DateTime.parse(map['server_time_snapshot'] as String),
        clientServerOffsetMs: map['client_server_offset_ms'] as int,
        atividadeUpdatedAtSnapshot: map['atividade_updated_at_snapshot'] != null
            ? DateTime.tryParse(map['atividade_updated_at_snapshot'] as String)
            : null,
        sincronizado: (map['sincronizado'] as int? ?? 0) == 1,
        ultimoStatus: map['ultimo_status'] as String?,
      );
}
