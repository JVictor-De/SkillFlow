import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../config/app_theme.dart';
import '../../models/boletim.dart';
import '../../services/api_exception.dart';
import '../../services/responsavel_service.dart';
import '../../widgets/app_widgets.dart';

class BoletimScreen extends StatefulWidget {
  final FilhoVinculado filho;
  const BoletimScreen({super.key, required this.filho});

  @override
  State<BoletimScreen> createState() => _BoletimScreenState();
}

class _BoletimScreenState extends State<BoletimScreen> {
  final _service = ResponsavelService();
  Future<Boletim>? _future;
  String? _disciplina;

  @override
  void initState() {
    super.initState();
    _future = _service.getBoletim(alunoId: widget.filho.id);
  }

  void _filtrar(String? disciplina) {
    setState(() {
      _disciplina = disciplina;
      _future = _service.getBoletim(
        alunoId: widget.filho.id,
        disciplina: disciplina,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Boletim · ${widget.filho.nome}')),
      body: FutureBuilder<Boletim>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return StateMessage(
              icon: Icons.error_outline,
              title: 'Não foi possível carregar o boletim',
              subtitle: ApiException.friendly(snapshot.error!),
            );
          }
          final boletim = snapshot.data!;
          final disciplinas = {
            ...boletim.exercicios.map((e) => e.disciplina),
            ...boletim.provas.map((e) => e.disciplina),
          }.toList()
            ..sort();
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _MediaResumo(media: boletim.mediaGeral),
              const SizedBox(height: 16),
              SizedBox(
                height: 36,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    _FiltroChip(
                      label: 'Todas',
                      selected: _disciplina == null,
                      onTap: () => _filtrar(null),
                    ),
                    ...disciplinas.map(
                      (d) => Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: _FiltroChip(
                          label: d,
                          selected: _disciplina == d,
                          onTap: () => _filtrar(d),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              _Secao(titulo: 'Provas', items: boletim.provas),
              const SizedBox(height: 16),
              _Secao(titulo: 'Exercícios', items: boletim.exercicios),
            ],
          );
        },
      ),
    );
  }
}

class _MediaResumo extends StatelessWidget {
  final double media;
  const _MediaResumo({required this.media});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: AppTheme.brandGradient,
        borderRadius: BorderRadius.all(Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          const Icon(Icons.school, color: Colors.white),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Média geral ponderada',
              style: TextStyle(color: Colors.white70),
            ),
          ),
          Text(
            media.toStringAsFixed(0),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _FiltroChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _FiltroChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppTheme.brand : AppTheme.surface,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: selected ? AppTheme.brand : const Color(0x1AFFFFFF),
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : AppTheme.textMuted,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

class _Secao extends StatelessWidget {
  final String titulo;
  final List<BoletimItem> items;

  const _Secao({required this.titulo, required this.items});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Text(
            titulo,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppTheme.textMuted,
            ),
          ),
        ),
        const SizedBox(height: 8),
        if (items.isEmpty)
          GlassCard(
            child: Text(
              'Nenhum registro em $titulo.',
              style: const TextStyle(color: AppTheme.textMuted),
            ),
          )
        else
          ...items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _BoletimTile(item: item),
            ),
          ),
      ],
    );
  }
}

class _BoletimTile extends StatelessWidget {
  final BoletimItem item;
  const _BoletimTile({required this.item});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: item.isProva
                  ? AppTheme.danger.withOpacity(0.18)
                  : AppTheme.brand.withOpacity(0.18),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              item.isProva ? Icons.assignment_late : Icons.task_alt,
              color: item.isProva ? AppTheme.danger : AppTheme.brand,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.titulo,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                Text(
                  '${item.disciplina} · peso ${item.peso} · ${DateFormat('dd/MM').format(item.data)}',
                  style: const TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          GradeBadge(grade: item.nota),
        ],
      ),
    );
  }
}
