import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:skillflow_app/config/app_theme.dart';
import 'package:skillflow_app/models/submissao.dart';
import 'package:skillflow_app/providers/auth_provider.dart';
import 'package:skillflow_app/screens/aluno/painel_aluno_screen.dart';

Widget _wrap(Widget child) => ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: MaterialApp(theme: AppTheme.dark(), home: child),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('painel renderiza média e resumo', (tester) async {
    await tester.pumpWidget(_wrap(const PainelAlunoScreen()));
    await tester.pump(const Duration(milliseconds: 250));
    await tester.pump(const Duration(milliseconds: 250));

    expect(find.text('Média geral ponderada'), findsOneWidget);
    expect(find.text('Pendentes'), findsOneWidget);
    expect(find.text('Concluídas'), findsOneWidget);
    expect(find.text('Progresso por disciplina'), findsOneWidget);
  });

  group('PainelAluno.fromJson', () {
    test('aceita o contrato legado do SaaS (media_geral_ponderada etc.)', () {
      final p = PainelAluno.fromJson(<String, dynamic>{
        'media_geral_ponderada': 72,
        'progresso_por_disciplina': [
          {'disciplina': 'Matemática', 'media': 80},
        ],
        'historico_notas': [
          {
            'atividade_id': 1,
            'titulo': 'Prova 1',
            'disciplina': 'Matemática',
            'tipo': 'PROVA',
            'nota': 90,
            'data': '2026-04-20T18:00:00Z',
          }
        ],
        'atividades_pendentes': 1,
        'atividades_concluidas': 2,
      });
      expect(p.mediaGeral, 72);
      expect(p.progressoDisciplinas.first.disciplina, 'Matemática');
      expect(p.historico.first.tipo, 'PROVA');
    });

    test('media_geral nula vira 0 (não estoura "Não foi possível carregar")',
        () {
      final p = PainelAluno.fromJson(<String, dynamic>{
        'media_geral_ponderada': null,
        'progresso_por_disciplina': [],
        'historico_notas': [],
        'atividades_pendentes': 0,
        'atividades_concluidas': 0,
      });
      expect(p.mediaGeral, 0);
      expect(p.historico, isEmpty);
    });
  });
}
