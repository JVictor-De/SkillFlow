import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:skillflow_app/config/app_theme.dart';
import 'package:skillflow_app/providers/auth_provider.dart';
import 'package:skillflow_app/screens/login_screen.dart';

Widget _wrap(Widget child) => ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: MaterialApp(theme: AppTheme.dark(), home: child),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('renderiza campos de e-mail e senha', (tester) async {
    await tester.pumpWidget(_wrap(const LoginScreen()));
    expect(find.text('E-mail'), findsOneWidget);
    expect(find.text('Senha'), findsOneWidget);
    expect(find.text('Entrar'), findsOneWidget);
  });

  testWidgets('mostra erro quando senha é muito curta', (tester) async {
    await tester.pumpWidget(_wrap(const LoginScreen()));

    await tester.enterText(
      find.widgetWithText(TextFormField, 'E-mail'),
      'aluno@skillflow.dev',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Senha'),
      '1',
    );
    await tester.tap(find.widgetWithText(ElevatedButton, 'Entrar'));
    await tester.pump();

    expect(find.textContaining('pelo menos 4 caracteres'), findsOneWidget);
  });
}
