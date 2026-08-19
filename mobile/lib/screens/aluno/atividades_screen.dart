import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../config/app_theme.dart';
import '../../models/atividade.dart';
import '../../services/aluno_service.dart';
import '../../services/api_exception.dart';
import '../../widgets/app_widgets.dart';
import 'atividade_detalhe_screen.dart';

/// Filtro de tipo de atividade.
///
/// `todas` é o default. `exercicio` e `prova` filtram pelo
/// `tipo_atividade` no backend.
enum _AtividadeFiltro { todas, exercicio, prova }

class AtividadesScreen extends StatefulWidget {
  const AtividadesScreen({super.key});

  @override
  State<AtividadesScreen> createState() => _AtividadesScreenState();
}

class _AtividadesScreenState extends State<AtividadesScreen> {
  final _service = AlunoService();
  Future<List<Atividade>>? _future;
  _AtividadeFiltro _filtro = _AtividadeFiltro.todas;

  /// Quando `false`, atividades já concluídas pelo aluno ficam ocultas
  /// (estado padrão pedido pelo produto). Persistido apenas em memória,
  /// alinhado ao padrão do app — a lista é recalculada a cada sessão.
  bool _mostrarConcluidas = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    final future = _service.listAtividades(
      tipo: switch (_filtro) {
        _AtividadeFiltro.exercicio => AtividadeTipo.exercicio,
        _AtividadeFiltro.prova => AtividadeTipo.prova,
        _ => null,
      },
      // Pede ao backend só os pendentes quando o toggle está desligado.
      // Assim economizamos payload e mantemos a lista coerente mesmo se
      // o cliente cair em cache antigo.
      feitos: _mostrarConcluidas ? null : false,
    );
    setState(() {
      _future = future;
    });
  }

  /// Abre o detalhe da atividade. Quando o aluno volta (depois de
  /// concluir a tentativa), recarrega a lista para que a atividade
  /// suma de "Pendentes" caso o toggle esteja desligado.
  Future<void> _abrirAtividade(Atividade atividade) async {
    await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => AtividadeDetalheScreen(atividadeId: atividade.id),
      ),
    );
    if (!mounted) return;
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Atividades'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _load,
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _FilterChip(
                    label: 'Todas',
                    selected: _filtro == _AtividadeFiltro.todas,
                    onSelected: () => _setFiltro(_AtividadeFiltro.todas),
                  ),
                  const SizedBox(width: 8),
                  _FilterChip(
                    label: 'Exercícios',
                    selected: _filtro == _AtividadeFiltro.exercicio,
                    onSelected: () => _setFiltro(_AtividadeFiltro.exercicio),
                  ),
                  const SizedBox(width: 8),
                  _FilterChip(
                    label: 'Provas',
                    selected: _filtro == _AtividadeFiltro.prova,
                    onSelected: () => _setFiltro(_AtividadeFiltro.prova),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Icon(
                  _mostrarConcluidas
                      ? Icons.visibility_rounded
                      : Icons.visibility_off_rounded,
                  size: 18,
                  color: AppTheme.textMuted,
                ),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Mostrar concluídas',
                    style: TextStyle(fontSize: 13),
                  ),
                ),
                Switch.adaptive(
                  value: _mostrarConcluidas,
                  onChanged: _setMostrarConcluidas,
                ),
              ],
            ),
          ),
          Expanded(
            child: FutureBuilder<List<Atividade>>(
              future: _future,
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return StateMessage(
                    icon: Icons.error_outline,
                    title: 'Erro ao carregar atividades',
                    subtitle: ApiException.friendly(snapshot.error!),
                    action: ElevatedButton(
                      onPressed: _load,
                      child: const Text('Tentar novamente'),
                    ),
                  );
                }
                // Mesmo com `feitos=false` no backend, aplicamos um filtro
                // local de proteção — caso o backend ignore o parâmetro
                // (mock antigo, deploy parcial), o toggle continua honrado.
                var list = snapshot.data ?? const <Atividade>[];
                if (!_mostrarConcluidas) {
                  list = list.where((a) => !a.isCompleted).toList();
                }
                if (list.isEmpty) {
                  return StateMessage(
                    icon: Icons.assignment_late_outlined,
                    title: !_mostrarConcluidas
                        ? 'Nenhuma atividade pendente'
                        : 'Nenhuma atividade liberada',
                    subtitle: !_mostrarConcluidas
                        ? 'Tudo em dia! Ative "Mostrar concluídas" para rever as que você já fez.'
                        : 'Quando seu professor liberar uma atividade ela aparecerá aqui.',
                  );
                }
                return RefreshIndicator(
                  onRefresh: () async => _load(),
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                    itemCount: list.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, idx) => _AtividadeCard(
                      atividade: list[idx],
                      onTap: () => _abrirAtividade(list[idx]),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _setFiltro(_AtividadeFiltro filtro) {
    if (_filtro == filtro) return;
    setState(() => _filtro = filtro);
    _load();
  }

  void _setMostrarConcluidas(bool value) {
    if (_mostrarConcluidas == value) return;
    setState(() => _mostrarConcluidas = value);
    _load();
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onSelected;

  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onSelected(),
      selectedColor: AppTheme.brand.withOpacity(0.5),
      backgroundColor: AppTheme.surface,
      labelStyle: TextStyle(
        color: selected ? Colors.white : AppTheme.textMuted,
        fontWeight: FontWeight.w500,
      ),
      shape: const StadiumBorder(side: BorderSide(color: Color(0x1AFFFFFF))),
    );
  }
}

class _AtividadeCard extends StatelessWidget {
  final Atividade atividade;
  final VoidCallback onTap;

  const _AtividadeCard({required this.atividade, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isProva = atividade.tipo == AtividadeTipo.prova;
    return GestureDetector(
      onTap: onTap,
      child: GlassCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  decoration: BoxDecoration(
                    gradient: isProva
                        ? const LinearGradient(
                            colors: [AppTheme.danger, AppTheme.warning],
                          )
                        : AppTheme.brandGradient,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  child: Text(
                    isProva
                        ? 'Prova · peso ${atividade.peso}'
                        : 'Exercício',
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ),
                const SizedBox(width: 8),
                if (atividade.isCompleted)
                  Container(
                    decoration: BoxDecoration(
                      color: AppTheme.success.withOpacity(0.18),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.check_circle,
                          size: 14,
                          color: AppTheme.success,
                        ),
                        SizedBox(width: 4),
                        Text(
                          'Concluído',
                          style: TextStyle(
                            color: AppTheme.success,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                const Spacer(),
                if (atividade.dataLimite != null)
                  Text(
                    'Até ${DateFormat('dd/MM').format(atividade.dataLimite!.toLocal())}',
                    style: TextStyle(
                      color: atividade.expirado
                          ? AppTheme.danger
                          : AppTheme.textMuted,
                      fontSize: 12,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              atividade.titulo,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 4),
            Text(
              atividade.disciplina,
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(
                  Icons.list_alt,
                  size: 16,
                  color: AppTheme.textMuted,
                ),
                const SizedBox(width: 4),
                Text(
                  '${atividade.exercicios.length} exercícios',
                  style: const TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 12,
                  ),
                ),
                if (atividade.qtdSubmetidos > 0 && !atividade.isCompleted) ...[
                  const SizedBox(width: 8),
                  Text(
                    '· ${atividade.qtdSubmetidos} respondidos',
                    style: const TextStyle(
                      color: AppTheme.brand,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
                const Spacer(),
                const Icon(
                  Icons.arrow_forward_ios,
                  size: 14,
                  color: AppTheme.textMuted,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
