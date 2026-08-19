import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:skillflow_app/models/role.dart';
import 'package:skillflow_app/services/api_exception.dart';
import 'package:skillflow_app/services/auth_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('AuthService (mock)', () {
    test('login do aluno retorna sessão e armazena usuário', () async {
      final service = AuthService();
      final session =
          await service.login(email: 'aluno@skillflow.dev', senha: '1234');
      expect(session.user.role, UserRole.aluno);
      expect(session.user.mustChangePassword, isFalse);

      final stored = await service.currentUser();
      expect(stored?.email, equals('aluno@skillflow.dev'));
    });

    test('login do responsável é aceito', () async {
      final service = AuthService();
      final session =
          await service.login(email: 'pais@skillflow.dev', senha: '1234');
      expect(session.user.role, UserRole.responsavel);
    });

    test('login de docente é rejeitado pelo app', () async {
      final service = AuthService();
      expect(
        () => service.login(email: 'professor@skillflow.dev', senha: '1234'),
        throwsA(isA<ApiException>()),
      );
    });

    test('senha curta é rejeitada', () async {
      final service = AuthService();
      expect(
        () => service.login(email: 'aluno@skillflow.dev', senha: '12'),
        throwsA(isA<ApiException>()),
      );
    });

    test('must_change_password redireciona via flag', () async {
      final service = AuthService();
      final session =
          await service.login(email: 'novato@skillflow.dev', senha: '1234');
      expect(session.user.mustChangePassword, isTrue);

      await service.trocarSenha(
        senhaAtual: 'qualquer',
        novaSenha: 'novaSenha-123',
      );
      final user = await service.currentUser();
      expect(user?.mustChangePassword, isFalse);
    });
  });
}
