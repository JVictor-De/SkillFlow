import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/app_widgets.dart';
import '../login_screen.dart';

class PerfilScreen extends StatelessWidget {
  const PerfilScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final themeProvider = context.watch<ThemeProvider>();
    final isDarkMode = themeProvider.isDarkMode;
    return Scaffold(
      appBar: AppBar(title: const Text('Perfil')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          GlassCard(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: AppTheme.brand.withOpacity(0.2),
                  child: Text(
                    (user?.nome ?? user?.email ?? '??')
                        .substring(0, 2)
                        .toUpperCase(),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.brand,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  user?.nome ?? 'Aluno',
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
                Text(
                  user?.email ?? '',
                  style: const TextStyle(color: AppTheme.textMuted),
                ),
                if (user?.turmaNome != null) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceMuted,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(user!.turmaNome!),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
          GlassCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.notifications_outlined),
                  title: const Text('Notificações'),
                  trailing: Switch(
                    value: true,
                    onChanged: (_) {},
                  ),
                ),
                Divider(
                  height: 1,
                  color: Theme.of(context).dividerColor,
                ),
                ListTile(
                  leading: const Icon(Icons.dark_mode_outlined),
                  title: Text(
                    'Modo Escuro',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  subtitle: Text(
                    isDarkMode
                        ? 'Aparência escura ativada'
                        : 'Aparência clara ativada',
                    style: GoogleFonts.inter(
                      color: Theme.of(context).textTheme.bodySmall?.color,
                    ),
                  ),
                  trailing: Switch(
                    value: isDarkMode,
                    onChanged: themeProvider.toggleTheme,
                  ),
                ),
                Divider(
                  height: 1,
                  color: Theme.of(context).dividerColor,
                ),
                ListTile(
                  leading:
                      const Icon(Icons.logout, color: AppTheme.danger),
                  title: const Text(
                    'Sair',
                    style: TextStyle(color: AppTheme.danger),
                  ),
                  onTap: () async {
                    await context.read<AuthProvider>().logout();
                    if (!context.mounted) return;
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(
                        builder: (_) => const LoginScreen(),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
