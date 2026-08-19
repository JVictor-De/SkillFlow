import 'package:flutter/material.dart';

import '../../config/app_theme.dart';
import '../../models/atividade.dart';
import '../../models/submissao.dart';
import '../../services/aluno_service.dart';
import '../../services/api_exception.dart';
import '../../widgets/app_widgets.dart';
import 'responder_atividade_screen.dart';

class AtividadeDetalheScreen extends StatefulWidget {
  final int atividadeId;
  const AtividadeDetalheScreen({super.key, required this.atividadeId});

  @override
  State<AtividadeDetalheScreen> createState() => _AtividadeDetalheScreenState();
}

class _AtividadeDetalheScreenState extends State<AtividadeDetalheScreen> {
  final _service = AlunoService();
  Future<_AtividadeDetalheData>? _future;

  @override
  void initState() {
    super.initState();
    _future = _carregar();
  }

  /// Carrega a atividade + submissões já feitas pelo aluno em paralelo.
  /// Com isso conseguimos diferenciar exercício "Pendente" de "Respondido"
  /// no preview, e iniciar a tentativa direto na primeira questão pendente.
  Future<_AtividadeDetalheData> _carregar() async {
    final atividadeFuture = _service.getAtividade(widget.atividadeId);
    final submissoesFuture =
        _service.listSubmissoesAtividade(widget.atividadeId);
    final atividade = await atividadeFuture;
    // listSubmissoesAtividade não é crítica: se falhar (e.g. timeout
    // transitório), seguimos com lista vazia para não bloquear a UI.
    List<Submissao> submissoes = const [];
    try {
      submissoes = await submissoesFuture;
    } catch (_) {
      submissoes = const [];
    }
    return _AtividadeDetalheData(atividade: atividade, submissoes: submissoes);
  }

  Future<void> _iniciarAtividade(_AtividadeDetalheData data) async {
    final concluida = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => ResponderAtividadeScreen(
          atividade: data.atividade,
          submissoesIniciais: data.submissoes,
        ),
      ),
    );
    if (!mounted) return;
    if (concluida == true) {
      // Aluno concluiu a tentativa. Volta direto para a lista de
      // atividades (que vai recarregar e mostrar em "Feitos").
      Navigator.of(context).pop(true);
    } else {
      setState(() {
        _future = _carregar();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detalhe da atividade')),
      body: FutureBuilder<_AtividadeDetalheData>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return StateMessage(
              icon: Icons.error_outline,
              title: 'Não conseguimos carregar',
              subtitle: ApiException.friendly(snapshot.error!),
            );
          }
          final data = snapshot.data!;
          final atividade = data.atividade;
          final exerciciosRespondidos =
              data.submissoes.map((s) => s.exercicioId).toSet();
          final totalEx = atividade.exercicios.length;
          final feitos = exerciciosRespondidos.length;
          final tudoFeito = totalEx > 0 && feitos >= totalEx;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              GradientHeader(
                title: atividade.titulo,
                subtitle:
                    '${atividade.disciplina} · ${atividade.tipo == AtividadeTipo.prova ? 'Prova · peso ${atividade.peso}' : 'Exercício'}',
              ),
              const SizedBox(height: 16),
              GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.play_circle_fill,
                          color: AppTheme.brand,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            tudoFeito
                                ? 'Atividade concluída'
                                : feitos == 0
                                    ? 'Pronto para começar'
                                    : 'Continuar de onde parou',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 16,
                            ),
                          ),
                        ),
                        Text(
                          '$feitos / $totalEx',
                          style: const TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      tudoFeito
                          ? 'Você já respondeu todas as questões. Os resultados ficam disponíveis no painel.'
                          : 'A tentativa avança automaticamente para a próxima questão a cada resposta enviada.',
                      style: const TextStyle(
                        color: AppTheme.textMuted,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        icon: Icon(
                          tudoFeito
                              ? Icons.check_circle
                              : feitos == 0
                                  ? Icons.play_arrow
                                  : Icons.fast_forward,
                        ),
                        label: Text(
                          tudoFeito
                              ? 'Atividade concluída'
                              : feitos == 0
                                  ? 'Iniciar atividade'
                                  : 'Continuar atividade',
                        ),
                        onPressed: tudoFeito || totalEx == 0
                            ? null
                            : () => _iniciarAtividade(data),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              ...atividade.exercicios.map(
                (exercicio) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _ExercicioTile(
                    exercicio: exercicio,
                    respondido:
                        exerciciosRespondidos.contains(exercicio.id),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _AtividadeDetalheData {
  final Atividade atividade;
  final List<Submissao> submissoes;
  _AtividadeDetalheData({required this.atividade, required this.submissoes});
}

class _ExercicioTile extends StatelessWidget {
  final Exercicio exercicio;
  final bool respondido;

  const _ExercicioTile({required this.exercicio, required this.respondido});

  String get _tipoLabel {
    switch (exercicio.tipo) {
      case ExercicioTipo.multiplaEscolha:
        return 'Múltipla escolha';
      case ExercicioTipo.dissertativaTexto:
        return 'Dissertativa (texto)';
      case ExercicioTipo.dissertativa:
        return 'Anexo (PDF)';
    }
  }

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: respondido
                ? AppTheme.success.withOpacity(0.18)
                : AppTheme.brand.withOpacity(0.18),
            child: respondido
                ? const Icon(
                    Icons.check,
                    size: 16,
                    color: AppTheme.success,
                  )
                : Text(
                    '${exercicio.ordem}',
                    style: const TextStyle(
                      color: AppTheme.brand,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  exercicio.enunciado,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 14),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceMuted,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        _tipoLabel,
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 10,
                        ),
                      ),
                    ),
                    if (respondido) ...[
                      const SizedBox(width: 6),
                      const Text(
                        'Respondida',
                        style: TextStyle(
                          color: AppTheme.success,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
