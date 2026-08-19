import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../config/app_theme.dart';
import '../../models/submissao.dart';
import '../../providers/auth_provider.dart';
import '../../services/aluno_service.dart';
import '../../services/api_exception.dart';
import '../../widgets/app_widgets.dart';

class PainelAlunoScreen extends StatefulWidget {
  const PainelAlunoScreen({super.key});

  @override
  State<PainelAlunoScreen> createState() => _PainelAlunoScreenState();
}

class _PainelAlunoScreenState extends State<PainelAlunoScreen> {
  final _service = AlunoService();
  Future<PainelAluno>? _future;

  @override
  void initState() {
    super.initState();
    _future = _service.getPainel();
  }

  Future<void> _refresh() async {
    setState(() {
      _future = _service.getPainel();
    });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    return Scaffold(
      appBar: AppBar(
        title: Text(
          user?.nome != null ? 'Olá, ${user!.nome!.split(' ').first}!' : 'Painel',
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 12),
            child: Icon(Icons.notifications_outlined),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<PainelAluno>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return StateMessage(
                icon: Icons.error_outline,
                title: 'Não foi possível carregar o painel',
                subtitle: ApiException.friendly(snapshot.error!),
                action: ElevatedButton(
                  onPressed: _refresh,
                  child: const Text('Tentar novamente'),
                ),
              );
            }
            final p = snapshot.data!;
            return ListView(
              padding: const EdgeInsets.all(16),
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                _MediaCard(
                  media: p.mediaGeral,
                  pendentes: p.atividadesPendentes,
                  concluidas: p.atividadesConcluidas,
                ),
                const SizedBox(height: 16),
                GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Progresso por disciplina',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ...p.progressoDisciplinas.map((d) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 6),
                            child: _DisciplinaRow(disciplina: d),
                          )),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Histórico recente',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 12),
                      if (p.historico.isEmpty)
                        const Text(
                          'Nenhuma nota registrada ainda.',
                          style: TextStyle(color: AppTheme.textMuted),
                        )
                      else
                        ...p.historico.map(_HistoricoTile.new),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _MediaCard extends StatelessWidget {
  final double media;
  final int pendentes;
  final int concluidas;

  const _MediaCard({
    required this.media,
    required this.pendentes,
    required this.concluidas,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: AppTheme.brandGradient,
        borderRadius: BorderRadius.all(Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Média geral ponderada',
            style: TextStyle(color: Colors.white70),
          ),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                media.toStringAsFixed(0),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 56,
                  fontWeight: FontWeight.w700,
                  height: 1,
                ),
              ),
              const SizedBox(width: 4),
              const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: Text(
                  '/ 100',
                  style: TextStyle(color: Colors.white70),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _MediaPill(label: 'Pendentes', value: pendentes.toString()),
              const SizedBox(width: 8),
              _MediaPill(label: 'Concluídas', value: concluidas.toString()),
            ],
          ),
        ],
      ),
    );
  }
}

class _MediaPill extends StatelessWidget {
  final String label;
  final String value;

  const _MediaPill({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.18),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11)),
            const SizedBox(height: 2),
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DisciplinaRow extends StatelessWidget {
  final DisciplinaResumo disciplina;
  const _DisciplinaRow({required this.disciplina});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: Text(disciplina.disciplina)),
            Text(
              disciplina.media.toStringAsFixed(0),
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            minHeight: 8,
            backgroundColor: Colors.white.withOpacity(0.06),
            value: (disciplina.media / 100).clamp(0, 1),
            valueColor: AlwaysStoppedAnimation(
              disciplina.media >= 70
                  ? AppTheme.success
                  : disciplina.media >= 50
                      ? AppTheme.warning
                      : AppTheme.danger,
            ),
          ),
        ),
      ],
    );
  }
}

class _HistoricoTile extends StatelessWidget {
  final HistoricoNota nota;
  const _HistoricoTile(this.nota);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppTheme.brand.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              nota.tipo == 'PROVA' ? Icons.assignment_late : Icons.task_alt,
              color: AppTheme.brand,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  nota.titulo,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  '${nota.disciplina} · ${DateFormat('dd/MM').format(nota.data)}',
                  style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                ),
              ],
            ),
          ),
          GradeBadge(grade: nota.nota),
        ],
      ),
    );
  }
}

