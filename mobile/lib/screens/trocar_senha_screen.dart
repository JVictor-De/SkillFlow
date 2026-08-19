import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/app_theme.dart';
import '../providers/auth_provider.dart';
import 'home_router.dart';

class TrocarSenhaScreen extends StatefulWidget {
  const TrocarSenhaScreen({super.key});

  @override
  State<TrocarSenhaScreen> createState() => _TrocarSenhaScreenState();
}

class _TrocarSenhaScreenState extends State<TrocarSenhaScreen> {
  final _atual = TextEditingController();
  final _nova = TextEditingController();
  final _confirmar = TextEditingController();
  final _form = GlobalKey<FormState>();
  String? _localError;

  @override
  void dispose() {
    _atual.dispose();
    _nova.dispose();
    _confirmar.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    if (_nova.text != _confirmar.text) {
      setState(() => _localError = 'As senhas não coincidem.');
      return;
    }
    setState(() => _localError = null);
    final auth = context.read<AuthProvider>();
    final ok = await auth.trocarSenha(_atual.text, _nova.text);
    if (!ok || !mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const HomeRouter()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Definir nova senha')),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _form,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Você está usando uma senha provisória. Crie uma senha forte para continuar.',
                      style: TextStyle(color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 24),
                    TextFormField(
                      controller: _atual,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'Senha atual',
                      ),
                      validator: (v) =>
                          (v == null || v.isEmpty) ? 'Informe a senha atual' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _nova,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'Nova senha',
                      ),
                      validator: (v) => (v == null || v.length < 8)
                          ? 'Mínimo 8 caracteres'
                          : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _confirmar,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'Confirmar nova senha',
                      ),
                    ),
                    if (_localError != null || auth.error != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.danger.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          _localError ?? auth.error!,
                          style: const TextStyle(color: AppTheme.danger),
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: auth.loading ? null : _submit,
                      child: auth.loading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Atualizar senha'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
