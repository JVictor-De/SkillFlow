import 'package:flutter/material.dart';

import '../../config/app_theme.dart';
import '../../services/aluno_service.dart';
import '../../services/api_exception.dart';
import '../../widgets/app_widgets.dart';
import 'chat_tutor_screen.dart';

class ResultadoScreen extends StatefulWidget {
  final int submissaoId;
  const ResultadoScreen({super.key, required this.submissaoId});

  @override
  State<ResultadoScreen> createState() => _ResultadoScreenState();
}

class _ResultadoScreenState extends State<ResultadoScreen> {
  final _service = AlunoService();
  Future<Map<String, dynamic>>? _future;

  @override
  void initState() {
    super.initState();
    _future = _service.getResultado(widget.submissaoId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Resultado')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return StateMessage(
              icon: Icons.error_outline,
              title: 'Não foi possível carregar o resultado',
              subtitle: ApiException.friendly(snapshot.error!),
            );
          }
          final data = snapshot.data!;
          final notaFinal = (data['nota_final'] as num?)?.toDouble();
          final feedback = (data['feedback_professor'] as String?)?.isNotEmpty == true
              ? data['feedback_professor'] as String
              : data['feedback_ia'] as String? ?? 'Sem feedback ainda.';
          final status = data['status'] as String;
          final corrigida =
              status == 'CORRIGIDA' || status == 'REVISADA_PROFESSOR';
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                decoration: const BoxDecoration(
                  gradient: AppTheme.brandGradient,
                  borderRadius: BorderRadius.all(Radius.circular(28)),
                ),
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Sua nota',
                      style: TextStyle(color: Colors.white70),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          notaFinal?.toStringAsFixed(0) ?? '—',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 64,
                            fontWeight: FontWeight.w700,
                            height: 1,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Padding(
                          padding: EdgeInsets.only(bottom: 6),
                          child: Text(
                            '/ 100',
                            style: TextStyle(color: Colors.white70),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.18),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      child: Text(
                        status.replaceAll('_', ' '),
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Feedback',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(feedback),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                icon: const Icon(Icons.chat_outlined),
                label: const Text('Conversar com o tutor'),
                onPressed: corrigida
                    ? () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => ChatTutorScreen(
                              submissaoId: widget.submissaoId,
                            ),
                          ),
                        )
                    : null,
              ),
              if (!corrigida) ...[
                const SizedBox(height: 8),
                const Text(
                  'O chat fica disponível assim que sua submissão for corrigida.',
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}
