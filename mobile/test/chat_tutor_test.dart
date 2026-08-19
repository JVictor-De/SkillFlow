import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:skillflow_app/config/app_theme.dart';
import 'package:skillflow_app/providers/auth_provider.dart';
import 'package:skillflow_app/screens/aluno/chat_tutor_screen.dart';

Widget _wrap(Widget child) => ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: MaterialApp(theme: AppTheme.dark(), home: child),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('contador inicia 0/3 e bloqueia quando submissão não corrigida',
      (tester) async {
    await tester.pumpWidget(_wrap(
      const ChatTutorScreen(submissaoId: 9001, corrigida: false),
    ));
    await tester.pumpAndSettle();
    expect(find.text('0/3'), findsOneWidget);
    expect(
      find.text('Aguarde a correção para usar o chat.'),
      findsOneWidget,
    );
  });
}
