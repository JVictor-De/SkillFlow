class FilhoVinculado {
  final int id;
  final String nome;
  final String? turmaNome;
  final String? escolaNome;

  const FilhoVinculado({
    required this.id,
    required this.nome,
    this.turmaNome,
    this.escolaNome,
  });

  factory FilhoVinculado.fromJson(Map<String, dynamic> json) => FilhoVinculado(
        id: json['id'] as int,
        nome: json['nome'] as String,
        turmaNome: json['turma_nome'] as String?,
        escolaNome: json['escola_nome'] as String?,
      );
}

class BoletimItem {
  final int atividadeId;
  final String titulo;
  final String disciplina;
  final double nota;
  final int peso;
  final DateTime data;
  final String tipo; // EXERCICIO | PROVA

  const BoletimItem({
    required this.atividadeId,
    required this.titulo,
    required this.disciplina,
    required this.nota,
    required this.peso,
    required this.data,
    required this.tipo,
  });

  factory BoletimItem.fromJson(Map<String, dynamic> json) => BoletimItem(
        atividadeId: json['atividade_id'] as int,
        titulo: json['titulo'] as String,
        disciplina: json['disciplina'] as String,
        nota: (json['nota'] as num).toDouble(),
        peso: (json['peso'] as int?) ?? 1,
        data: DateTime.parse(json['data'] as String),
        tipo: json['tipo'] as String,
      );

  bool get isProva => tipo.toUpperCase() == 'PROVA';
}

class Boletim {
  final double mediaGeral;
  final List<BoletimItem> provas;
  final List<BoletimItem> exercicios;

  const Boletim({
    required this.mediaGeral,
    required this.provas,
    required this.exercicios,
  });

  factory Boletim.fromJson(Map<String, dynamic> json) {
    final all = ((json['itens'] as List<dynamic>?) ?? const [])
        .map((e) => BoletimItem.fromJson(e as Map<String, dynamic>))
        .toList();
    return Boletim(
      mediaGeral: (json['media_geral'] as num).toDouble(),
      provas: all.where((i) => i.isProva).toList(),
      exercicios: all.where((i) => !i.isProva).toList(),
    );
  }
}
