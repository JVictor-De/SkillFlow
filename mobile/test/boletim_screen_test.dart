import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:skillflow_app/config/app_theme.dart';
import 'package:skillflow_app/models/boletim.dart';
import 'package:skillflow_app/providers/auth_provider.dart';
import 'package:skillflow_app/screens/responsavel/boletim_screen.dart';

Widget _wrap(Widget child) => ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: MaterialApp(theme: AppTheme.dark(), home: child),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('boletim separa provas e exercícios em seções', (tester) async {
    const filho = FilhoVinculado(
      id: 100,
      nome: 'Ana Beatriz',
      turmaNome: '9º Ano A',
      escolaNome: 'Colégio Horizonte',
    );
    await tester.pumpWidget(_wrap(const BoletimScreen(filho: filho)));
    await tester.pump(const Duration(milliseconds: 250));
    await tester.pump(const Duration(milliseconds: 250));

    expect(find.text('Provas'), findsOneWidget);
    expect(find.text('Exercícios'), findsOneWidget);
    expect(find.text('Média geral ponderada'), findsOneWidget);
  });
}
