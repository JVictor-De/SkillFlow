import 'package:flutter_test/flutter_test.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:sqflite/sqflite.dart' as sqflite;

import 'package:skillflow_app/services/sync_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() {
    sqfliteFfiInit();
    sqflite.databaseFactory = databaseFactoryFfi;
  });

  test('SyncService calcula offset entre cliente e servidor', () async {
    final sync = SyncService();
    await sync.calculateOffset(now: () => DateTime(2026, 4, 26, 12));
    expect(sync.clientServerOffsetMs, isA<int>());
  });

  test('Submissão MC é enfileirada e marcada como sincronizada após envio',
      () async {
    final sync = SyncService();
    await sync.calculateOffset();
    final id = await sync.enqueueSubmissaoMC(
      exercicioId: 6001,
      atividadeId: 600,
      letra: 'B',
      atividadeUpdatedAt: DateTime.now().toUtc(),
    );
    expect(id, greaterThan(0));
    expect(await sync.pendentesCount, greaterThan(0));

    await sync.sendPendentes();
    expect(await sync.pendentesCount, 0);
  });
}
