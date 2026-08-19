import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:skillflow_app/config/app_theme.dart';
import 'package:skillflow_app/models/atividade.dart';
import 'package:skillflow_app/providers/auth_provider.dart';
import 'package:skillflow_app/screens/aluno/responder_atividade_screen.dart';

Widget _wrap(Widget child) => ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: MaterialApp(theme: AppTheme.dark(), home: child),
    );

Atividade _atividadeComTexto() {
  return const Atividade(
    id: 700,
    titulo: 'Atividade com texto',
    disciplina: 'Português',
    tipo: AtividadeTipo.exercicio,
    peso: 1,
    exercicios: [
      Exercicio(
        id: 7001,
        ordem: 1,
        tipo: ExercicioTipo.dissertativaTexto,
        enunciado: 'Resuma em 3 linhas a obra "Vidas Secas".',
        alternativas: [],
      ),
    ],
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets(
    'renderiza campo de texto livre quando o exercício é DISSERTATIVA_TEXTO',
    (tester) async {
      await tester.pumpWidget(
        _wrap(
          ResponderAtividadeScreen(
            atividade: _atividadeComTexto(),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 200));

      // Mostra o label do tipo correto.
      expect(find.text('Dissertativa (texto)'), findsOneWidget);
      // O usuário precisa ter um TextField para digitar a resposta.
      expect(find.byType(TextField), findsOneWidget);
      // Hint dentro do TextField com instrução clara.
      expect(find.text('Sua resposta'), findsOneWidget);
    },
  );

  testWidgets(
    'mostra erro ao tentar enviar texto vazio em DISSERTATIVA_TEXTO',
    (tester) async {
      await tester.pumpWidget(
        _wrap(
          ResponderAtividadeScreen(
            atividade: _atividadeComTexto(),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 200));

      // A tela usa `ElevatedButton.icon`, que internamente devolve a
      // classe privada `_ElevatedButtonWithIcon` (subclasse de
      // `ElevatedButton`). `find.widgetWithText` usa `byType` por
      // baixo dos panos, e `byType` não casa subclasses — por isso
      // procuramos pelo `Text` direto, que é único na tela e fica
      // dentro do botão. `tester.tap` propaga o gesto até o
      // `ElevatedButton.icon` ancestral.
      final botaoEnviar = find.text('Enviar e finalizar');
      expect(botaoEnviar, findsOneWidget);
      await tester.tap(botaoEnviar);
      await tester.pump();
      expect(
        find.text('Escreva sua resposta antes de enviar.'),
        findsOneWidget,
      );
    },
  );
}
