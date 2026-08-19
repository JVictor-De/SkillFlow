class RankingItem {
  final int posicao;
  final int alunoId;
  final String alunoNome;
  final double pontuacao;

  const RankingItem({
    required this.posicao,
    required this.alunoId,
    required this.alunoNome,
    required this.pontuacao,
  });

  factory RankingItem.fromJson(Map<String, dynamic> json) => RankingItem(
        posicao: json['posicao'] as int,
        alunoId: json['aluno_id'] as int,
        // Backend retorna `aluno_nome` no contrato novo; mantém fallback
        // para `nome` (legado) para sobreviver a deploys parciais.
        alunoNome: (json['aluno_nome'] as String?) ??
            (json['nome'] as String?) ??
            '',
        pontuacao: (json['pontuacao'] as num? ?? 0).toDouble(),
      );
}

class Ranking {
  final bool ativo;
  final String? mensagem;
  final List<RankingItem> itens;

  const Ranking({
    required this.ativo,
    this.mensagem,
    this.itens = const [],
  });

  /// Aceita `itens` (contrato novo) e `ranking` (contrato SaaS legado).
  factory Ranking.fromJson(Map<String, dynamic> json) {
    final raw = (json['itens'] ?? json['ranking']) as List<dynamic>? ??
        const [];
    return Ranking(
      ativo: json['ativo'] as bool? ?? false,
      mensagem: json['mensagem'] as String?,
      itens: raw
          .map((e) => RankingItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
