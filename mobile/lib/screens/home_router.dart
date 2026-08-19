import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/role.dart';
import '../providers/auth_provider.dart';
import 'aluno/aluno_shell.dart';
import 'login_screen.dart';
import 'responsavel/seletor_filhos_screen.dart';

class HomeRouter extends StatelessWidget {
  const HomeRouter({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    if (user == null) {
      return const LoginScreen();
    }
    switch (user.role) {
      case UserRole.aluno:
        return const AlunoShell();
      case UserRole.responsavel:
        return const SeletorFilhosScreen();
      default:
        return const LoginScreen();
    }
  }
}
