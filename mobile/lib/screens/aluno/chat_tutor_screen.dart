import 'package:flutter/material.dart';

import '../../config/app_theme.dart';
import '../../services/aluno_service.dart';
import '../../services/api_exception.dart';

class ChatTutorScreen extends StatefulWidget {
  final int submissaoId;
  final bool corrigida;

  const ChatTutorScreen({
    super.key,
    required this.submissaoId,
    this.corrigida = true,
  });

  @override
  State<ChatTutorScreen> createState() => _ChatTutorScreenState();
}

class _ChatTutorScreenState extends State<ChatTutorScreen> {
  final _service = AlunoService();
  final _controller = TextEditingController();
  final _messages = <_Message>[];
  int _contador = 0;
  bool _enviando = false;
  String? _erro;

  static const int maxMensagens = 3;

  bool get _bloqueado => _contador >= maxMensagens || !widget.corrigida;

  Future<void> _enviar() async {
    final texto = _controller.text.trim();
    if (texto.isEmpty || _bloqueado) return;
    setState(() {
      _enviando = true;
      _erro = null;
      _messages.add(_Message(role: 'aluno', text: texto));
      _controller.clear();
    });
    try {
      final response = await _service.chat(
        submissaoId: widget.submissaoId,
        mensagem: texto,
        contadorAtual: _contador,
      );
      if (!mounted) return;
      setState(() {
        _contador = response['contador_mensagens_aluno'] as int? ?? _contador + 1;
        _messages.add(
          _Message(role: 'tutor', text: response['resposta'] as String),
        );
      });
    } catch (err) {
      setState(() => _erro = ApiException.friendly(err));
    } finally {
      setState(() => _enviando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat com o tutor IA'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.brand.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  '$_contador/$maxMensagens',
                  style: const TextStyle(color: AppTheme.brand),
                ),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (!widget.corrigida)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.warning.withOpacity(0.18),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'Aguarde a correção para usar o chat.',
                    style: TextStyle(color: AppTheme.warning),
                  ),
                ),
              ),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _messages.length,
                itemBuilder: (_, idx) {
                  final msg = _messages[idx];
                  final isAluno = msg.role == 'aluno';
                  return Align(
                    alignment:
                        isAluno ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.symmetric(vertical: 6),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        gradient: isAluno ? AppTheme.brandGradient : null,
                        color: isAluno ? null : AppTheme.surface,
                        borderRadius: BorderRadius.only(
                          topLeft: const Radius.circular(16),
                          topRight: const Radius.circular(16),
                          bottomLeft:
                              Radius.circular(isAluno ? 16 : 4),
                          bottomRight:
                              Radius.circular(isAluno ? 4 : 16),
                        ),
                      ),
                      child: Text(
                        msg.text,
                        style: TextStyle(
                          color: isAluno ? Colors.white : AppTheme.textPrimary,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            if (_erro != null)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.danger.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(_erro!,
                    style: const TextStyle(color: AppTheme.danger)),
              ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      enabled: !_bloqueado && !_enviando,
                      maxLines: 3,
                      minLines: 1,
                      decoration: InputDecoration(
                        hintText: _bloqueado
                            ? 'Limite de mensagens atingido'
                            : 'Digite sua dúvida...',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _bloqueado || _enviando ? null : _enviar,
                    child: const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Message {
  final String role;
  final String text;
  _Message({required this.role, required this.text});
}
