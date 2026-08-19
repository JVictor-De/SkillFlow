import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:skillflow_app/config/app_theme.dart';
import 'package:skillflow_app/providers/auth_provider.dart';
import 'package:skillflow_app/screens/aluno/atividades_screen.dart';

Widget _wrap(Widget child) => ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: MaterialApp(theme: AppTheme.dark(), home: child),
    );

Future<void> _settle(WidgetTester tester) async {
  // O FutureBuilder espera ~220ms (mocks). Damos folga e cobrimos o
  // primeiro frame de animação dos chips.
  for (var i = 0; i < 4; i++) {
    await tester.pump(const Duration(milliseconds: 250));
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('lista de atividades renderiza filtro por tipo', (tester) async {
    await tester.pumpWidget(_wrap(const AtividadesScreen()));
    await _settle(tester);
    expect(find.text('Todas'), findsOneWidget);
    expect(find.text('Exercícios'), findsOneWidget);
    expect(find.text('Provas'), findsOneWidget);
  });

  testWidgets('toggle "Mostrar concluídas" inicia desligado', (tester) async {
    await tester.pumpWidget(_wrap(const AtividadesScreen()));
    await _settle(tester);
    expect(find.text('Mostrar concluídas'), findsOneWidget);
    final toggle = tester.widget<Switch>(find.byType(Switch));
    expect(toggle.value, isFalse);
  });

  testWidgets('alterar toggle dispara recarregamento da lista',
      (tester) async {
    await tester.pumpWidget(_wrap(const AtividadesScreen()));
    await _settle(tester);
    await tester.tap(find.byType(Switch));
    await _settle(tester);
    final toggle = tester.widget<Switch>(find.byType(Switch));
    expect(toggle.value, isTrue);
    // A lista permanece visível (mocks têm atividades não concluídas).
    expect(find.text('Sintaxe da oração subordinada'), findsOneWidget);
  });
}
