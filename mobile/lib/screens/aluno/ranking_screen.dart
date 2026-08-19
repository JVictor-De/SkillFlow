import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/app_theme.dart';
import '../../models/ranking.dart';
import '../../providers/auth_provider.dart';
import '../../services/aluno_service.dart';
import '../../services/api_exception.dart';
import '../../widgets/app_widgets.dart';

class RankingScreen extends StatefulWidget {
  const RankingScreen({super.key});

  @override
  State<RankingScreen> createState() => _RankingScreenState();
}

class _RankingScreenState extends State<RankingScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ranking'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Pontuação'),
            Tab(text: 'Provas'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _RankingList(tipo: 'pontuacao'),
          _RankingList(tipo: 'provas'),
        ],
      ),
    );
  }
}

class _RankingList extends StatefulWidget {
  final String tipo;
  const _RankingList({required this.tipo});

  @override
  State<_RankingList> createState() => _RankingListState();
}

class _RankingListState extends State<_RankingList>
    with AutomaticKeepAliveClientMixin {
  final _service = AlunoService();
  Future<Ranking>? _future;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _future = _service.getRanking(tipo: widget.tipo);
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final myId = context.watch<AuthProvider>().user?.id;
    return FutureBuilder<Ranking>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return StateMessage(
            icon: Icons.error_outline,
            title: 'Não foi possível carregar o ranking',
            subtitle: ApiException.friendly(snapshot.error!),
            action: ElevatedButton(
              onPressed: () => setState(
                () => _future = _service.getRanking(tipo: widget.tipo),
              ),
              child: const Text('Tentar novamente'),
            ),
          );
        }
        final ranking = snapshot.data!;
        if (!ranking.ativo) {
          return StateMessage(
            icon: Icons.bedtime_outlined,
            title: 'Ranking desativado',
            subtitle: ranking.mensagem ??
                'O professor ainda não habilitou esse ranking para a turma.',
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: ranking.itens.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (_, idx) {
            final item = ranking.itens[idx];
            final me = item.alunoId == myId;
            return GlassCard(
              color: me ? AppTheme.brand.withOpacity(0.18) : null,
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      gradient: me ? AppTheme.brandGradient : null,
                      color: me ? null : AppTheme.surfaceMuted,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '${item.posicao}',
                      style: TextStyle(
                        color: me ? Colors.white : AppTheme.textPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      item.alunoNome + (me ? ' (você)' : ''),
                      style: TextStyle(
                        fontWeight: me ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                  ),
                  Text(
                    item.pontuacao.toStringAsFixed(1),
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
