import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:skillflow_app/config/app_theme.dart';
import 'package:skillflow_app/models/atividade.dart';
import 'package:skillflow_app/providers/auth_provider.dart';
import 'package:skillflow_app/screens/aluno/responder_mc_screen.dart';

Widget _wrap(Widget child) => ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: MaterialApp(theme: AppTheme.dark(), home: child),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('MC permite selecionar uma alternativa e habilitar envio',
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
      id: 6001,
      ordem: 1,
      tipo: ExercicioTipo.multiplaEscolha,
      enunciado: 'Marque a alternativa correta:',
      alternativas: [
        Alternativa(letra: 'A', texto: 'Alpha'),
        Alternativa(letra: 'B', texto: 'Beta'),
        Alternativa(letra: 'C', texto: 'Gama'),
        Alternativa(letra: 'D', texto: 'Delta'),
        Alternativa(letra: 'E', texto: 'Épsilon'),
      ],
    );
    await tester.pumpWidget(
      _wrap(const ResponderMcScreen(atividade: atividade, exercicio: exercicio)),
    );

    final enviar =
        find.widgetWithText(ElevatedButton, 'Enviar resposta');
    expect(tester.widget<ElevatedButton>(enviar).onPressed, isNull);

    await tester.tap(find.text('Beta'));
    await tester.pump();

    expect(tester.widget<ElevatedButton>(enviar).onPressed, isNotNull);
  });
}
