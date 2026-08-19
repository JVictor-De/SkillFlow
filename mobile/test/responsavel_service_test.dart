import 'package:flutter_test/flutter_test.dart';

import 'package:skillflow_app/services/responsavel_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ResponsavelService (mock)', () {
    test('listFilhos devolve filhos do mock', () async {
      final service = ResponsavelService();
      final filhos = await service.listFilhos();
      expect(filhos, isNotEmpty);
    });

    test('boletim separa provas e exercícios', () async {
      final service = ResponsavelService();
      final boletim = await service.getBoletim(alunoId: 100);
      expect(boletim.mediaGeral, isNonZero);
      expect(boletim.provas.every((b) => b.isProva), isTrue);
      expect(boletim.exercicios.every((b) => !b.isProva), isTrue);
    });

    test('boletim aceita filtro por disciplina', () async {
      final service = ResponsavelService();
      final boletim =
          await service.getBoletim(alunoId: 100, disciplina: 'Matemática');
      final all = [...boletim.provas, ...boletim.exercicios];
      expect(all.every((b) => b.disciplina == 'Matemática'), isTrue);
    });
  });
}
