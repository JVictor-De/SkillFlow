import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/app_theme.dart';
import '../../models/boletim.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_exception.dart';
import '../../services/responsavel_service.dart';
import '../../widgets/app_widgets.dart';
import '../login_screen.dart';
import 'boletim_screen.dart';

class SeletorFilhosScreen extends StatefulWidget {
  const SeletorFilhosScreen({super.key});

  @override
  State<SeletorFilhosScreen> createState() => _SeletorFilhosScreenState();
}

class _SeletorFilhosScreenState extends State<SeletorFilhosScreen> {
  final _service = ResponsavelService();
  Future<List<FilhoVinculado>>? _future;

  @override
  void initState() {
    super.initState();
    _future = _carregar();
  }

  Future<List<FilhoVinculado>> _carregar() async {
    final filhos = await _service.listFilhos();
    if (filhos.length == 1 && mounted) {
      Future.microtask(() {
        if (!mounted) return;
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => BoletimScreen(filho: filhos.first),
          ),
        );
      });
    }
    return filhos;
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Seus filhos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await auth.logout();
              if (!context.mounted) return;
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              );
            },
          ),
        ],
      ),
      body: FutureBuilder<List<FilhoVinculado>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return StateMessage(
              icon: Icons.error_outline,
              title: 'Não conseguimos carregar seus filhos',
              subtitle: ApiException.friendly(snapshot.error!),
            );
          }
          final filhos = snapshot.data ?? const <FilhoVinculado>[];
          if (filhos.isEmpty) {
            return const StateMessage(
              icon: Icons.family_restroom,
              title: 'Nenhum aluno vinculado',
              subtitle:
                  'Solicite ao coordenador para vincular você ao aluno desejado.',
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: filhos.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, idx) => _FilhoCard(
              filho: filhos[idx],
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => BoletimScreen(filho: filhos[idx]),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _FilhoCard extends StatelessWidget {
  final FilhoVinculado filho;
  final VoidCallback onTap;

  const _FilhoCard({required this.filho, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: GlassCard(
        child: Row(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: AppTheme.brand.withOpacity(0.18),
              child: Text(
                filho.nome.substring(0, 1).toUpperCase(),
                style: const TextStyle(
                  color: AppTheme.brand,
                  fontWeight: FontWeight.w700,
                  fontSize: 18,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    filho.nome,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    [filho.turmaNome, filho.escolaNome]
                        .whereType<String>()
                        .join(' · '),
                    style: const TextStyle(
                      color: AppTheme.textMuted,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios,
                size: 14, color: AppTheme.textMuted),
          ],
        ),
      ),
    );
  }
}
