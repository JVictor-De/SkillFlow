import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../config/app_theme.dart';
import '../../config/env.dart';
import '../../models/atividade.dart';
import '../../models/submissao.dart';
import '../../services/aluno_service.dart';
import '../../services/api_exception.dart';
import '../../widgets/app_widgets.dart';

/// Fluxo sequencial de resolução de uma atividade.
///
/// Recebe a [atividade] já carregada e a lista de [submissoesIniciais]
/// que o aluno já enviou (para pular automaticamente questões respondidas
/// e evitar 409 do backend).
///
/// Comportamento:
/// 1. Mostra a primeira questão **pendente** (não respondida).
/// 2. Ao enviar a resposta, **avança automaticamente** para a próxima
///    questão pendente.
/// 3. Quando todas as questões forem enviadas, exibe um modal de
///    sucesso parabenizando o aluno e fecha a tela.
/// 4. Se o backend retornar 409 ("já enviou"), tratamos como sucesso
///    silencioso e seguimos em frente — o aluno só vê o erro real se
///    tentar burlar o sistema (cenário que o backend continua bloqueando).
class ResponderAtividadeScreen extends StatefulWidget {
  final Atividade atividade;
  final List<Submissao> submissoesIniciais;

  const ResponderAtividadeScreen({
    super.key,
    required this.atividade,
    this.submissoesIniciais = const [],
  });

  @override
  State<ResponderAtividadeScreen> createState() =>
      _ResponderAtividadeScreenState();
}

class _ResponderAtividadeScreenState extends State<ResponderAtividadeScreen> {
  final _service = AlunoService();
  late final PageController _pageController;
  late final List<Exercicio> _ordemExercicios;
  late final Set<int> _respondidosIds;

  // Estado por questão (preserva entre rebuilds quando o aluno
  // navega para frente/trás dentro do PageView).
  final Map<int, String?> _mcSelecionada = {};
  final Map<int, _PdfSelecionado?> _pdfSelecionado = {};
  final Map<int, TextEditingController> _textoControllers = {};

  bool _enviando = false;
  String? _erro;

  TextEditingController _controllerFor(int exercicioId) {
    return _textoControllers.putIfAbsent(
      exercicioId,
      () => TextEditingController(),
    );
  }

  @override
  void initState() {
    super.initState();
    _ordemExercicios = [...widget.atividade.exercicios]
      ..sort((a, b) => a.ordem.compareTo(b.ordem));
    _respondidosIds =
        widget.submissoesIniciais.map((s) => s.exercicioId).toSet();
    final inicial = _primeiroPendente();
    _pageController = PageController(initialPage: inicial);
  }

  @override
  void dispose() {
    _pageController.dispose();
    for (final controller in _textoControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  int _primeiroPendente() {
    for (var i = 0; i < _ordemExercicios.length; i++) {
      if (!_respondidosIds.contains(_ordemExercicios[i].id)) return i;
    }
    return _ordemExercicios.isEmpty ? 0 : _ordemExercicios.length - 1;
  }

  bool get _todasRespondidas =>
      _respondidosIds.length >= _ordemExercicios.length;

  /// Índice da questão visível, sempre dentro de [0, último].
  int _paginaAtual() {
    if (_ordemExercicios.isEmpty) return 0;
    final maxIndex = _ordemExercicios.length - 1;
    final raw = _pageController.hasClients
        ? (_pageController.page ?? 0).round()
        : 0;
    return raw.clamp(0, maxIndex);
  }

  Future<void> _enviarRespostaAtual(int index) async {
    final exercicio = _ordemExercicios[index];

    switch (exercicio.tipo) {
      case ExercicioTipo.multiplaEscolha:
        final letra = _mcSelecionada[exercicio.id];
        if (letra == null) {
          setState(() => _erro = 'Selecione uma alternativa.');
          return;
        }
        await _enviarMC(exercicio, letra);
        break;
      case ExercicioTipo.dissertativaTexto:
        final texto = _controllerFor(exercicio.id).text.trim();
        if (texto.isEmpty) {
          setState(() => _erro = 'Escreva sua resposta antes de enviar.');
          return;
        }
        await _enviarDissertativaTexto(exercicio, texto);
        break;
      case ExercicioTipo.dissertativa:
        final pdf = _pdfSelecionado[exercicio.id];
        if (pdf == null) {
          setState(() => _erro = 'Anexe um PDF antes de enviar.');
          return;
        }
        await _enviarDissertativa(exercicio, pdf);
        break;
    }
  }

  Future<void> _enviarMC(Exercicio exercicio, String letra) async {
    setState(() {
      _enviando = true;
      _erro = null;
    });
    try {
      await _service.submeterMC(
        exercicioId: exercicio.id,
        atividadeId: widget.atividade.id,
        letra: letra,
      );
      _avancarOuFinalizar(exercicio);
    } on ApiException catch (err) {
      // 409 = já respondeu (race condition / duplo clique). Trata como
      // sucesso silencioso e segue — só mostramos a mensagem de erro real
      // se o backend retornar algo diferente, que é o cenário em que o
      // aluno realmente está tentando burlar o sistema.
      if (err.statusCode == 409) {
        _avancarOuFinalizar(exercicio);
      } else {
        setState(() => _erro = ApiException.friendly(err));
      }
    } catch (err) {
      setState(() => _erro = ApiException.friendly(err));
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  Future<void> _enviarDissertativa(
    Exercicio exercicio,
    _PdfSelecionado pdf,
  ) async {
    setState(() {
      _enviando = true;
      _erro = null;
    });
    try {
      final now = DateTime.now().toUtc();
      await _service.submeterDissertativa(
        exercicioId: exercicio.id,
        atividadeId: widget.atividade.id,
        pdfBytes: pdf.bytes,
        filename: pdf.name,
        timestampLocal: now,
        clientServerOffsetMs: 0,
        serverTimeSnapshot: now,
        atividadeUpdatedAtSnapshot: widget.atividade.updatedAt,
      );
      _avancarOuFinalizar(exercicio);
    } on ApiException catch (err) {
      if (err.statusCode == 409) {
        _avancarOuFinalizar(exercicio);
      } else {
        setState(() => _erro = ApiException.friendly(err));
      }
    } catch (err) {
      setState(() => _erro = ApiException.friendly(err));
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  Future<void> _enviarDissertativaTexto(
    Exercicio exercicio,
    String texto,
  ) async {
    setState(() {
      _enviando = true;
      _erro = null;
    });
    try {
      final now = DateTime.now().toUtc();
      await _service.submeterDissertativaTexto(
        exercicioId: exercicio.id,
        atividadeId: widget.atividade.id,
        texto: texto,
        timestampLocal: now,
        clientServerOffsetMs: 0,
        serverTimeSnapshot: now,
        atividadeUpdatedAtSnapshot: widget.atividade.updatedAt,
      );
      _avancarOuFinalizar(exercicio);
    } on ApiException catch (err) {
      if (err.statusCode == 409) {
        _avancarOuFinalizar(exercicio);
      } else {
        setState(() => _erro = ApiException.friendly(err));
      }
    } catch (err) {
      setState(() => _erro = ApiException.friendly(err));
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  void _avancarOuFinalizar(Exercicio respondido) {
    _respondidosIds.add(respondido.id);
    if (_todasRespondidas) {
      _exibirSucesso();
      return;
    }
    final atual = _paginaAtual();
    final proximo = atual + 1;
    if (proximo < _ordemExercicios.length) {
      _pageController.animateToPage(
        proximo,
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOut,
      );
    } else {
      _exibirSucesso();
    }
  }

  Future<void> _exibirSucesso() async {
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (_) => const _SucessoDialog(),
    );
    if (!mounted) return;
    Navigator.of(context).pop(true);
  }

  Future<void> _selecionarPdf(int exercicioId) async {
    // ⚠️ Em Flutter Web `result.files.first.path` é sempre null.
    // Usamos `withData: true` para pedir os bytes em memória —
    // funciona em todas as plataformas.
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;
    final picked = result.files.first;
    final bytes = picked.bytes;
    if (bytes == null) {
      setState(() => _erro =
          'Não foi possível ler o PDF. Tente novamente em outro navegador.');
      return;
    }
    if (bytes.length > Env.submissaoPdfMaxBytes) {
      setState(() => _erro = 'PDF excede o limite de 10MB.');
      return;
    }
    setState(() {
      _pdfSelecionado[exercicioId] =
          _PdfSelecionado(bytes: bytes, name: picked.name);
      _erro = null;
    });
  }

  Future<void> _capturarFoto(int exercicioId) async {
    final picker = ImagePicker();
    final XFile? foto = await picker.pickImage(source: ImageSource.camera);
    if (foto == null) return;
    final bytes = await foto.readAsBytes();
    setState(() {
      _pdfSelecionado[exercicioId] = _PdfSelecionado(
        bytes: bytes,
        name: foto.name.toLowerCase().endsWith('.pdf')
            ? foto.name
            : '${foto.name}.pdf',
      );
      _erro = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_ordemExercicios.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.atividade.titulo)),
        body: const StateMessage(
          icon: Icons.inbox_outlined,
          title: 'Esta atividade não tem questões.',
        ),
      );
    }

    if (_todasRespondidas && !_enviando) {
      // Caso o aluno entre numa atividade já 100% concluída,
      // mostra o sucesso direto (não há nada para responder).
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _exibirSucesso();
      });
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.atividade.titulo),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
            child: AnimatedBuilder(
            animation: _pageController,
            builder: (_, __) {
              final pagina = _paginaAtual();
              final progresso =
                  (_respondidosIds.length / _ordemExercicios.length)
                      .clamp(0.0, 1.0);
              return LinearProgressIndicator(
                minHeight: 4,
                value: progresso,
                backgroundColor: Colors.white.withOpacity(0.06),
                valueColor:
                    const AlwaysStoppedAnimation(AppTheme.brand),
                semanticsLabel: 'Questão ${pagina + 1} de '
                    '${_ordemExercicios.length}',
              );
            },
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: _ordemExercicios.length,
                physics: const NeverScrollableScrollPhysics(),
                itemBuilder: (_, index) {
                  final exercicio = _ordemExercicios[index];
                  return _ExercicioPagina(
                    atividade: widget.atividade,
                    exercicio: exercicio,
                    indice: index,
                    total: _ordemExercicios.length,
                    jaRespondida: _respondidosIds.contains(exercicio.id),
                    letraSelecionada: _mcSelecionada[exercicio.id],
                    pdfSelecionado: _pdfSelecionado[exercicio.id],
                    textoController: exercicio.tipo ==
                            ExercicioTipo.dissertativaTexto
                        ? _controllerFor(exercicio.id)
                        : null,
                    onTextoChanged: (_) {
                      if (_erro != null) {
                        setState(() => _erro = null);
                      }
                    },
                    onSelecionarLetra: (letra) => setState(() {
                      _mcSelecionada[exercicio.id] = letra;
                      _erro = null;
                    }),
                    onSelecionarPdf: () => _selecionarPdf(exercicio.id),
                    onCapturarFoto: kIsWeb
                        ? null
                        : () => _capturarFoto(exercicio.id),
                    onLimparPdf: () => setState(
                      () => _pdfSelecionado[exercicio.id] = null,
                    ),
                    erro: _erro,
                  );
                },
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: AnimatedBuilder(
                  animation: _pageController,
                  builder: (_, __) {
                    final pagina = _paginaAtual();
                    final isLast = pagina == _ordemExercicios.length - 1;
                    return ElevatedButton.icon(
                      icon: Icon(
                        isLast ? Icons.flag : Icons.arrow_forward_rounded,
                      ),
                      label: Text(
                        _enviando
                            ? 'Enviando…'
                            : isLast
                                ? 'Enviar e finalizar'
                                : 'Enviar e avançar',
                      ),
                      onPressed: _enviando
                          ? null
                          : () => _enviarRespostaAtual(pagina),
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ExercicioPagina extends StatelessWidget {
  final Atividade atividade;
  final Exercicio exercicio;
  final int indice;
  final int total;
  final bool jaRespondida;
  final String? letraSelecionada;
  final _PdfSelecionado? pdfSelecionado;
  final TextEditingController? textoController;
  final ValueChanged<String>? onTextoChanged;
  final ValueChanged<String> onSelecionarLetra;
  final VoidCallback onSelecionarPdf;
  final VoidCallback? onCapturarFoto;
  final VoidCallback onLimparPdf;
  final String? erro;

  const _ExercicioPagina({
    required this.atividade,
    required this.exercicio,
    required this.indice,
    required this.total,
    required this.jaRespondida,
    required this.letraSelecionada,
    required this.pdfSelecionado,
    required this.textoController,
    required this.onTextoChanged,
    required this.onSelecionarLetra,
    required this.onSelecionarPdf,
    required this.onCapturarFoto,
    required this.onLimparPdf,
    required this.erro,
  });

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
    final isMC = exercicio.tipo == ExercicioTipo.multiplaEscolha;
    final isTexto = exercicio.tipo == ExercicioTipo.dissertativaTexto;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.brand.withOpacity(0.18),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                'Questão ${indice + 1} de $total',
                style: const TextStyle(
                  color: AppTheme.brand,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.surfaceMuted,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                _tipoLabel,
                style: const TextStyle(
                  color: AppTheme.textMuted,
                  fontSize: 11,
                ),
              ),
            ),
            if (jaRespondida) ...[
              const SizedBox(width: 8),
              const Icon(
                Icons.check_circle,
                size: 16,
                color: AppTheme.success,
              ),
            ],
          ],
        ),
        const SizedBox(height: 12),
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                atividade.disciplina,
                style: const TextStyle(
                  color: AppTheme.textMuted,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                exercicio.enunciado,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (isMC)
          ...exercicio.alternativas.map(
            (alt) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _AlternativaTile(
                letra: alt.letra,
                texto: alt.texto,
                selecionada: letraSelecionada == alt.letra,
                onTap: () => onSelecionarLetra(alt.letra),
              ),
            ),
          )
        else if (isTexto)
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Sua resposta',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Digite sua resposta no campo abaixo. A correção é feita por IA com revisão do professor.',
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: textoController,
                  onChanged: onTextoChanged,
                  minLines: 5,
                  maxLines: 12,
                  textCapitalization: TextCapitalization.sentences,
                  decoration: const InputDecoration(
                    hintText:
                        'Escreva sua resposta com pelo menos 1 frase completa…',
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
            ),
          )
        else
          _PdfPicker(
            pdf: pdfSelecionado,
            onSelecionar: onSelecionarPdf,
            onCapturar: onCapturarFoto,
            onLimpar: onLimparPdf,
          ),
        if (erro != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.danger.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              erro!,
              style: const TextStyle(color: AppTheme.danger),
            ),
          ),
        ],
        const SizedBox(height: 24),
      ],
    );
  }
}

class _AlternativaTile extends StatelessWidget {
  final String letra;
  final String texto;
  final bool selecionada;
  final VoidCallback onTap;

  const _AlternativaTile({
    required this.letra,
    required this.texto,
    required this.selecionada,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        decoration: BoxDecoration(
          color: selecionada
              ? AppTheme.brand.withOpacity(0.18)
              : AppTheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selecionada ? AppTheme.brand : const Color(0x1AFFFFFF),
            width: selecionada ? 1.4 : 1,
          ),
        ),
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: selecionada ? AppTheme.brandGradient : null,
                color: selecionada ? null : AppTheme.surfaceMuted,
                borderRadius: BorderRadius.circular(12),
              ),
              alignment: Alignment.center,
              child: Text(
                letra,
                style: TextStyle(
                  color: selecionada ? Colors.white : AppTheme.textPrimary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(child: Text(texto)),
          ],
        ),
      ),
    );
  }
}

class _PdfPicker extends StatelessWidget {
  final _PdfSelecionado? pdf;
  final VoidCallback onSelecionar;
  final VoidCallback? onCapturar;
  final VoidCallback onLimpar;

  const _PdfPicker({
    required this.pdf,
    required this.onSelecionar,
    required this.onCapturar,
    required this.onLimpar,
  });

  @override
  Widget build(BuildContext context) {
    if (pdf == null) {
      return GlassCard(
        child: Column(
          children: [
            const Icon(Icons.picture_as_pdf, color: AppTheme.brand, size: 32),
            const SizedBox(height: 8),
            const Text(
              'Envie o PDF da sua resposta',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 4),
            const Text(
              'Limite de 10MB. Use scanner ou um PDF pronto.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                if (onCapturar != null) ...[
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onCapturar,
                      icon: const Icon(Icons.camera_alt_outlined),
                      label: const Text('Escanear'),
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: onSelecionar,
                    icon: const Icon(Icons.upload_file),
                    label: const Text('Anexar PDF'),
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }
    return GlassCard(
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.brand.withOpacity(0.18),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.picture_as_pdf, color: AppTheme.brand),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  pdf!.name,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                Text(
                  '${(pdf!.bytes.length / 1024).toStringAsFixed(0)} KB',
                  style: const TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: onLimpar,
          ),
        ],
      ),
    );
  }
}

class _PdfSelecionado {
  final Uint8List bytes;
  final String name;

  const _PdfSelecionado({required this.bytes, required this.name});
}

class _SucessoDialog extends StatelessWidget {
  const _SucessoDialog();

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(24),
      child: Container(
        decoration: const BoxDecoration(
          gradient: AppTheme.brandGradient,
          borderRadius: BorderRadius.all(Radius.circular(28)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.18),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.emoji_events_rounded,
                size: 38,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Parabéns!',
              style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Você concluiu todas as questões desta atividade.\n'
              'Seu esforço de hoje é o que constrói a sua nota de amanhã.\n'
              'Continue assim — você está mandando muito bem! 💪',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppTheme.brand,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                onPressed: () => Navigator.of(context).pop(),
                child: const Text(
                  'Voltar para atividades',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
