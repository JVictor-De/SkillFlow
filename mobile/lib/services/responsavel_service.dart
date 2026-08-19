import '../config/env.dart';
import '../models/boletim.dart';
import 'api_client.dart';
import 'mock_data.dart';

class ResponsavelService {
  final ApiClient _client;

  ResponsavelService({ApiClient? client}) : _client = client ?? ApiClient();

  Future<List<FilhoVinculado>> listFilhos() async {
    if (Env.useMocks) {
      await Future<void>.delayed(const Duration(milliseconds: 200));
      return mockFilhos.map(FilhoVinculado.fromJson).toList();
    }
    final raw = await _client.get('/api/app/responsavel/filhos/');
    final list = (raw as Map<String, dynamic>)['results'] as List<dynamic>;
    return list
        .map((e) => FilhoVinculado.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Boletim> getBoletim({
    required int alunoId,
    String? disciplina,
  }) async {
    if (Env.useMocks) {
      await Future<void>.delayed(const Duration(milliseconds: 220));
      final filtered = Map<String, dynamic>.from(mockBoletim);
      if (disciplina != null && disciplina.isNotEmpty) {
        final items = (filtered['itens'] as List<dynamic>)
            .where((e) => (e as Map<String, dynamic>)['disciplina'] == disciplina)
            .toList();
        filtered['itens'] = items;
      }
      return Boletim.fromJson(filtered);
    }
    final raw = await _client.get(
      '/api/app/responsavel/filhos/$alunoId/boletim/',
      query: {if (disciplina != null) 'disciplina': disciplina},
    );
    return Boletim.fromJson(raw as Map<String, dynamic>);
  }
}
