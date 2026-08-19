import 'role.dart';

class AuthUser {
  final int id;
  final String email;
  final String? nome;
  final UserRole role;
  final bool mustChangePassword;
  final int? turmaId;
  final String? turmaNome;
  final int? escolaId;
  final String? escolaNome;

  const AuthUser({
    required this.id,
    required this.email,
    required this.role,
    required this.mustChangePassword,
    this.nome,
    this.turmaId,
    this.turmaNome,
    this.escolaId,
    this.escolaNome,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as int,
      email: json['email'] as String,
      nome: json['nome'] as String?,
      role: roleFromString(json['role'] as String),
      mustChangePassword: json['must_change_password'] as bool? ?? false,
      turmaId: json['turma_id'] as int?,
      turmaNome: json['turma_nome'] as String?,
      escolaId: json['escola_id'] as int?,
      escolaNome: json['escola_nome'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'nome': nome,
        'role': roleToString(role),
        'must_change_password': mustChangePassword,
        'turma_id': turmaId,
        'turma_nome': turmaNome,
        'escola_id': escolaId,
        'escola_nome': escolaNome,
      };

  AuthUser copyWith({bool? mustChangePassword}) => AuthUser(
        id: id,
        email: email,
        nome: nome,
        role: role,
        mustChangePassword: mustChangePassword ?? this.mustChangePassword,
        turmaId: turmaId,
        turmaNome: turmaNome,
        escolaId: escolaId,
        escolaNome: escolaNome,
      );
}

class AuthSession {
  final String accessToken;
  final String refreshToken;
  final AuthUser user;

  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory AuthSession.fromJson(Map<String, dynamic> json) => AuthSession(
        accessToken: json['access_token'] as String,
        refreshToken: json['refresh_token'] as String,
        user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
      );
}
