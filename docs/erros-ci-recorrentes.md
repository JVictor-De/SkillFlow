# Erros recorrentes no CI

Anotações curtas de erros que já apareceram nos workflows do GitHub Actions, para evitar reincidência.

## Mobile (Flutter)

### `avoid_redundant_argument_values` no `flutter analyze`

- **O que é:** lint reclama quando passamos um valor que é igual ao default do parâmetro.
- **Onde costuma aparecer:**
  - `lib/config/app_theme.dart` em `ColorScheme.light(...)`: não passar `onPrimary: Colors.white` nem `surface: Colors.white` (já são default).
  - `test/**/*.dart` ao instanciar widgets: não passar `submissoesIniciais: const []` em `ResponderAtividadeScreen` (já é default).
- **Como evitar:** se o valor for igual ao default declarado na assinatura do construtor, simplesmente omita o argumento.

### `prefer_const_constructors` / `prefer_const_literals_to_create_immutables`

- **O que é:** o lint exige `const` em construtores e literais imutáveis quando possível.
- **Como evitar:** prefixe com `const` widgets/listas que não dependem de variáveis em runtime.

### `find.widgetWithText(ElevatedButton, ...)` quando a tela usa `ElevatedButton.icon`

- **O que é:** o teste falha com `Found 0 widgets with type "ElevatedButton" that are ancestors of widgets with text "..."` mesmo com o texto visível na tela.
- **Por que acontece:** `ElevatedButton.icon(...)` retorna a classe privada `_ElevatedButtonWithIcon` (subclasse de `ElevatedButton`). O `find.widgetWithText` usa `find.byType` por baixo, e `byType` faz checagem de tipo **exata** (`runtimeType ==`), sem casar subclasses.
- **Como evitar:** quando a tela usa `ElevatedButton.icon`, prefira `find.text('label do botão')` direto (o `tester.tap` propaga o gesto até o botão pai). Alternativa: `find.bySubtype<ElevatedButton>()` combinado com `find.ancestor`.

## Como reproduzir local antes de subir

```bash
cd mobile
flutter pub get
flutter analyze
flutter test
```

Se `flutter analyze` retornar 0 issues localmente, o job `Mobile (analyze + test)` passa.
