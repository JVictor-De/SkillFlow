import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../config/app_theme.dart';
import '../../config/env.dart';
import '../../models/atividade.dart';
import '../../services/aluno_service.dart';
import '../../services/api_exception.dart';
import '../../widgets/app_widgets.dart';
import 'resultado_screen.dart';

/// Tela standalone para responder uma única questão dissertativa.
///
/// O fluxo principal do app passa por [ResponderAtividadeScreen]; esta tela
/// permanece como rota auxiliar (e está coberta pelos testes existentes).
/// Funciona tanto em mobile quanto em **Flutter Web** — o seletor usa
/// `withData: true` para recuperar os bytes em memória, já que `File.path`
/// é nulo em Web.
class ResponderDissertativaScreen extends StatefulWidget {
  final Atividade atividade;
  final Exercicio exercicio;

  const ResponderDissertativaScreen({
    super.key,
    required this.atividade,
    required this.exercicio,
  });

  @override
  State<ResponderDissertativaScreen> createState() =>
      _ResponderDissertativaScreenState();
}

class _ResponderDissertativaScreenState
    extends State<ResponderDissertativaScreen> {
  final _service = AlunoService();
  Uint8List? _arquivoBytes;
  String? _arquivoNome;
  bool _enviando = false;
  String? _erro;
  bool _processando = false;

  Future<void> _selecionarPdf() async {
    // Em Flutter Web `path` é null. Pedindo `withData: true` o file_picker
    // entrega os bytes — funciona em todas as plataformas.
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;
    final picked = result.files.first;
    final bytes = picked.bytes;
    if (bytes == null) {
      setState(() => _erro = 'Não foi possível ler o PDF selecionado.');
      return;
    }
    if (bytes.length > Env.submissaoPdfMaxBytes) {
      setState(() => _erro = 'PDF excede o limite de 10MB.');
      return;
    }
    setState(() {
      _arquivoBytes = bytes;
      _arquivoNome = picked.name;
      _erro = null;
    });
  }

  Future<void> _capturarFoto() async {
    final picker = ImagePicker();
    final foto = await picker.pickImage(source: ImageSource.camera);
    if (foto == null) return;
    final bytes = await foto.readAsBytes();
    setState(() {
      _arquivoBytes = bytes;
      _arquivoNome = foto.name.toLowerCase().endsWith('.pdf')
          ? foto.name
          : '${foto.name}.pdf';
      _erro = null;
    });
  }

  Future<void> _enviar() async {
    if (_arquivoBytes == null || _arquivoNome == null) {
      setState(() => _erro = 'Anexe um PDF antes de enviar.');
      return;
    }
    setState(() {
      _enviando = true;
      _erro = null;
    });
    try {
      final now = DateTime.now().toUtc();
      final submissao = await _service.submeterDissertativa(
        exercicioId: widget.exercicio.id,
        atividadeId: widget.atividade.id,
        pdfBytes: _arquivoBytes!,
        filename: _arquivoNome!,
        timestampLocal: now,
        clientServerOffsetMs: 0,
        serverTimeSnapshot: now,
        atividadeUpdatedAtSnapshot: widget.atividade.updatedAt,
      );
      if (!mounted) return;
      setState(() => _processando = true);
      Future<void>.delayed(const Duration(milliseconds: 600), () {
        if (!mounted) return;
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => ResultadoScreen(submissaoId: submissao.id),
          ),
        );
      });
    } catch (err) {
      setState(() => _erro = ApiException.friendly(err));
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Dissertativa')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.atividade.titulo,
                    style: const TextStyle(
                      color: AppTheme.textMuted,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.exercicio.enunciado,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (_arquivoBytes == null)
              GlassCard(
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
                      'Limite de 10MB. Use scanner ou um PDF pronto do seu celular.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        if (!kIsWeb) ...[
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _capturarFoto,
                              icon: const Icon(Icons.camera_alt_outlined),
                              label: const Text('Escanear'),
                            ),
                          ),
                          const SizedBox(width: 12),
                        ],
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _selecionarPdf,
                            icon: const Icon(Icons.upload_file),
                            label: const Text('Anexar PDF'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              )
            else
              GlassCard(
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
                      child: Text(
                        _arquivoNome ?? 'PDF anexado',
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => setState(() {
                        _arquivoBytes = null;
                        _arquivoNome = null;
                      }),
                    ),
                  ],
                ),
              ),
            if (_processando) ...[
              const SizedBox(height: 12),
              GlassCard(
                color: AppTheme.brand.withOpacity(0.1),
                child: const Row(
                  children: [
                    SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text('Correção em processamento...'),
                    ),
                  ],
                ),
              ),
            ],
            if (_erro != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.danger.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _erro!,
                  style: const TextStyle(color: AppTheme.danger),
                ),
              ),
            ],
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _enviando ? null : _enviar,
              child: _enviando
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Enviar resposta'),
            ),
          ],
        ),
      ),
    );
  }
}
