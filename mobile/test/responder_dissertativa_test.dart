import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:skillflow_app/config/app_theme.dart';
import 'package:skillflow_app/models/atividade.dart';
import 'package:skillflow_app/providers/auth_provider.dart';
import 'package:skillflow_app/screens/aluno/responder_dissertativa_screen.dart';

Widget _wrap(Widget child) => ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: MaterialApp(theme: AppTheme.dark(), home: child),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('dissertativa exibe botões de escanear e anexar PDF',
      (tester) async {
    const atividade = Atividade(
      id: 600,
      titulo: 'Sintaxe',
      disciplina: 'Português',
      tipo: AtividadeTipo.exercicio,
      peso: 1,
      exercicios: [],
    );
    const exercicio = Exercicio(
      id: 6002,
      ordem: 2,
      tipo: ExercicioTipo.dissertativa,
      enunciado: 'Disserte sobre o tema:',
      alternativas: [],
    );
    await tester.pumpWidget(
      _wrap(const ResponderDissertativaScreen(
        atividade: atividade,
        exercicio: exercicio,
      )),
    );
    expect(find.text('Escanear'), findsOneWidget);
    expect(find.text('Anexar PDF'), findsOneWidget);
  });
}
