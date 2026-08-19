import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../config/env.dart';
import 'auth_service.dart';

/// Wrapper de Firebase Cloud Messaging.
/// Em modo mock evita inicializar Firebase para permitir rodar sem
/// credenciais durante o desenvolvimento.
class PushService {
  final AuthService _authService;

  PushService({AuthService? authService})
      : _authService = authService ?? AuthService();

  Future<void> initialize() async {
    if (Env.useMocks) return;
    try {
      await Firebase.initializeApp();
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission();
      final token = await messaging.getToken();
      if (token != null) {
        await _authService.registerDeviceToken(token);
      }
      messaging.onTokenRefresh.listen(_authService.registerDeviceToken);
    } catch (err, stack) {
      debugPrint('Falha ao inicializar FCM: $err\n$stack');
    }
  }
}
