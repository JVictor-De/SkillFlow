import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:skillflow_app/config/app_theme.dart';
import 'package:skillflow_app/models/ranking.dart';
import 'package:skillflow_app/providers/auth_provider.dart';
import 'package:skillflow_app/screens/aluno/ranking_screen.dart';

Widget _wrap(Widget child) => ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: MaterialApp(theme: AppTheme.dark(), home: child),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('ranking de provas (desativado) mostra mensagem amigável',
      (tester) async {
    await tester.pumpWidget(_wrap(const RankingScreen()));
    // Vai para a aba "Provas".
    await tester.pumpAndSettle();
    await tester.tap(find.text('Provas'));
    await tester.pumpAndSettle(const Duration(seconds: 1));
    expect(find.text('Ranking desativado'), findsOneWidget);
  });

  group('Ranking.fromJson', () {
    test('aceita contrato novo (itens + aluno_nome)', () {
      final r = Ranking.fromJson(<String, dynamic>{
        'ativo': true,
        'itens': [
          {
            'posicao': 1,
            'aluno_id': 10,
            'aluno_nome': 'Ana',
            'pontuacao': 100,
          }
        ],
      });
      expect(r.ativo, isTrue);
      expect(r.itens, hasLength(1));
      expect(r.itens.first.alunoNome, 'Ana');
    });

    test('aceita contrato legado SaaS (ranking + nome)', () {
      final r = Ranking.fromJson(<String, dynamic>{
        'ativo': true,
        'ranking': [
          {
            'posicao': 1,
            'aluno_id': 11,
            'nome': 'Bruno',
            'pontuacao': 0,
          }
        ],
      });
      expect(r.itens.first.alunoNome, 'Bruno');
      expect(r.itens.first.pontuacao, 0);
    });

    test('aluno sem pontuação aparece com pontuacao=0', () {
      final r = Ranking.fromJson(<String, dynamic>{
        'ativo': true,
        'itens': [
          {
            'posicao': 1,
            'aluno_id': 1,
            'aluno_nome': 'Vencedor',
            'pontuacao': 100,
          },
          {
            'posicao': 2,
            'aluno_id': 2,
            'aluno_nome': 'Sem nota',
            'pontuacao': 0,
          },
        ],
      });
      expect(r.itens, hasLength(2));
      expect(r.itens.last.pontuacao, 0);
      expect(r.itens.last.alunoNome, 'Sem nota');
    });
  });
}
