import 'package:flutter_test/flutter_test.dart';

import 'package:skillflow_app/models/atividade.dart';
import 'package:skillflow_app/services/aluno_service.dart';
import 'package:skillflow_app/services/api_exception.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AlunoService (mock)', () {
    test('listAtividades retorna mocks por padrão', () async {
      final service = AlunoService();
      final list = await service.listAtividades();
      expect(list, isNotEmpty);
      expect(list.first.exercicios, isNotEmpty);
    });

    test('listAtividades aceita filtro por tipo PROVA', () async {
      final service = AlunoService();
      final list = await service.listAtividades(tipo: AtividadeTipo.prova);
      expect(list.every((a) => a.tipo == AtividadeTipo.prova), isTrue);
    });

    test('submeterMC retorna submissao corrigida síncrona', () async {
      final service = AlunoService();
      final s = await service.submeterMC(
        exercicioId: 6001,
        atividadeId: 600,
        letra: 'B',
      );
      expect(s.notaFinal, 100);
      expect(s.atividadeId, 600);
    });

    test('chat tutor bloqueia após 3 mensagens', () async {
      final service = AlunoService();
      // Permite até 3 mensagens (contador 0,1,2 → ok; 3 → bloqueia).
      var contador = 0;
      for (var i = 0; i < 3; i++) {
        final r = await service.chat(
          submissaoId: 9001,
          mensagem: 'oi $i',
          contadorAtual: contador,
        );
        contador = r['contador_mensagens_aluno'] as int;
      }
      expect(contador, 3);
      expect(
        () => service.chat(
          submissaoId: 9001,
          mensagem: 'quarta',
          contadorAtual: contador,
        ),
        throwsA(isA<ApiException>()),
      );
    });

    test('ranking de provas devolve mensagem quando desativado', () async {
      final service = AlunoService();
      final ranking = await service.getRanking(tipo: 'provas');
      expect(ranking.ativo, isFalse);
      expect(ranking.mensagem, isNotNull);
    });
  });
}
