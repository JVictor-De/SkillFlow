import '../config/env.dart';
import '../models/auth_user.dart';
import '../models/role.dart';
import 'api_client.dart';
import 'api_exception.dart';
import 'mock_data.dart';
import 'token_storage.dart';

class AuthService {
  final ApiClient _client;
  final TokenStorage _storage;

  AuthService({ApiClient? client, TokenStorage? storage})
      : _client = client ?? ApiClient(),
        _storage = storage ?? TokenStorage();

  Future<AuthSession> login({
    required String email,
    required String senha,
  }) async {
    Map<String, dynamic> raw;
    if (Env.useMocks) {
      await Future<void>.delayed(const Duration(milliseconds: 220));
      final found = mockUsers[email.toLowerCase()];
      if (found == null || senha.length < 4) {
        throw ApiException(400, 'Email ou senha inválidos.');
      }
      raw = found;
    } else {
      raw = (await _client.post(
        '/api/auth/login/',
        {'email': email, 'senha': senha},
        anonymous: true,
      ) as Map<String, dynamic>);
    }
    final session = AuthSession.fromJson(raw);
    ensureMobileRole(session.user);
    await _storage.save(session);
    return session;
  }

  void ensureMobileRole(AuthUser user) {
    if (user.role != UserRole.aluno && user.role != UserRole.responsavel) {
      throw ApiException(
        403,
        'Este app não é para docentes. Use a plataforma web.',
      );
    }
  }

  Future<void> trocarSenha({
    required String senhaAtual,
    required String novaSenha,
  }) async {
    if (Env.useMocks) {
      await Future<void>.delayed(const Duration(milliseconds: 200));
      if (novaSenha.length < 8) {
        throw ApiException(400, 'Senha precisa de pelo menos 8 caracteres.');
      }
      final user = await _storage.getUser();
      if (user != null) {
        await _storage.updateUser(user.copyWith(mustChangePassword: false));
      }
      return;
    }
    await _client.post('/api/auth/trocar-senha/', {
      'senha_atual': senhaAtual,
      'nova_senha': novaSenha,
    });
    final user = await _storage.getUser();
    if (user != null) {
      await _storage.updateUser(user.copyWith(mustChangePassword: false));
    }
  }

  Future<void> logout() async {
    if (!Env.useMocks) {
      try {
        final refresh = await _storage.getRefresh();
        await _client.post('/api/auth/logout/', {'refresh_token': refresh});
      } catch (_) {
        /* ignore network errors */
      }
    }
    await _storage.clear();
  }

  Future<AuthUser?> currentUser() => _storage.getUser();

  Future<void> registerDeviceToken(String token) async {
    if (Env.useMocks) return;
    final user = await _storage.getUser();
    if (user == null || user.role != UserRole.aluno) return;
    await _client.post('/api/app/device-token/', {'token': token});
  }
}
