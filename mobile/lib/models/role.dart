enum UserRole { aluno, professor, coordenador, responsavel }

UserRole roleFromString(String raw) {
  switch (raw.toUpperCase()) {
    case 'ALUNO':
      return UserRole.aluno;
    case 'PROFESSOR':
      return UserRole.professor;
    case 'COORDENADOR':
      return UserRole.coordenador;
    case 'RESPONSAVEL':
      return UserRole.responsavel;
    default:
      throw ArgumentError('Role desconhecida: $raw');
  }
}

String roleToString(UserRole role) => role.name.toUpperCase();
