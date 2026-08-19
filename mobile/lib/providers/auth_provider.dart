import 'package:flutter/foundation.dart';

import '../models/auth_user.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _service;
  AuthUser? _user;
  bool _loading = false;
  String? _error;

  AuthProvider({AuthService? service}) : _service = service ?? AuthService();

  AuthUser? get user => _user;
  bool get loading => _loading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;
  bool get mustChangePassword => _user?.mustChangePassword == true;

  Future<void> bootstrap() async {
    _user = await _service.currentUser();
    notifyListeners();
  }

  Future<bool> login(String email, String senha) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final session = await _service.login(email: email, senha: senha);
      _user = session.user;
      return true;
    } catch (err) {
      _error = err.toString();
      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<bool> trocarSenha(String atual, String nova) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _service.trocarSenha(senhaAtual: atual, novaSenha: nova);
      _user = _user?.copyWith(mustChangePassword: false);
      return true;
    } catch (err) {
      _error = err.toString();
      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _service.logout();
    _user = null;
    notifyListeners();
  }
}
