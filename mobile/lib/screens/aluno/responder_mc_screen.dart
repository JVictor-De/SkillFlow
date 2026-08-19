import 'package:flutter/material.dart';

import '../../config/app_theme.dart';
import '../../models/atividade.dart';
import '../../services/aluno_service.dart';
import '../../services/api_exception.dart';
import '../../widgets/app_widgets.dart';
import 'resultado_screen.dart';

class ResponderMcScreen extends StatefulWidget {
  final Atividade atividade;
  final Exercicio exercicio;

  const ResponderMcScreen({
    super.key,
    required this.atividade,
    required this.exercicio,
  });

  @override
  State<ResponderMcScreen> createState() => _ResponderMcScreenState();
}

class _ResponderMcScreenState extends State<ResponderMcScreen> {
  final _service = AlunoService();
  String? _selecionada;
  bool _enviando = false;
  String? _erro;

  Future<void> _enviar() async {
    if (_selecionada == null) return;
    setState(() {
      _enviando = true;
      _erro = null;
    });
    try {
      final submissao = await _service.submeterMC(
        exercicioId: widget.exercicio.id,
        atividadeId: widget.atividade.id,
        letra: _selecionada!,
      );
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => ResultadoScreen(submissaoId: submissao.id),
        ),
      );
    } catch (err) {
      setState(() => _erro = ApiException.friendly(err));
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final exercicio = widget.exercicio;
    return Scaffold(
      appBar: AppBar(title: const Text('Múltipla escolha')),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
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
                        const SizedBox(height: 6),
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
                  const SizedBox(height: 12),
                  ...exercicio.alternativas.map(
                    (alt) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: _AlternativaTile(
                        letra: alt.letra,
                        texto: alt.texto,
                        selecionada: _selecionada == alt.letra,
                        onTap: () =>
                            setState(() => _selecionada = alt.letra),
                      ),
                    ),
                  ),
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
                ],
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: ElevatedButton(
                  onPressed: _selecionada == null || _enviando ? null : _enviar,
                  child: _enviando
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Enviar resposta'),
                ),
              ),
            ),
          ],
        ),
      ),
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
