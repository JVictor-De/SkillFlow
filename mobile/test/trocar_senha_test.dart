import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:skillflow_app/config/app_theme.dart';
import 'package:skillflow_app/providers/auth_provider.dart';
import 'package:skillflow_app/screens/trocar_senha_screen.dart';

Widget _wrap(Widget child) => ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: MaterialApp(theme: AppTheme.dark(), home: child),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('mostra erro quando confirmação difere da nova senha',
      (tester) async {
    await tester.pumpWidget(_wrap(const TrocarSenhaScreen()));

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Senha atual'),
      'antiga',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Nova senha'),
      'novaForte!9',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Confirmar nova senha'),
      'diferente1',
    );
    await tester.tap(find.widgetWithText(ElevatedButton, 'Atualizar senha'));
    await tester.pump();
    expect(find.textContaining('não coincidem'), findsOneWidget);
  });
}
