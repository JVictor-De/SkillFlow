import { api } from "./api";
import { ApiError } from "./errors";
import { delay, mockUsers, useMocks } from "./mocks";
import { tokenStorage, userStorage } from "./storage";
import type { AuthSession, AuthUser, UserRole } from "@/types";

export type LoginInput = { email: string; senha: string };

export interface CadastroEscolaInput {
  escola_nome: string;
  escola_cnpj: string;
  coordenador_nome: string;
  coordenador_email: string;
  coordenador_senha: string;
}

const SAAS_ROLES: UserRole[] = ["PROFESSOR", "COORDENADOR"];

function hydrateSession(session: AuthSession): AuthSession {
  tokenStorage.set(session.access_token, session.refresh_token);
  userStorage.set<AuthUser>(session.user);
  if (typeof document !== "undefined") {
    const maxAge = 60 * 60 * 12; // 12 horas
    document.cookie = `skillflow.session_hint=1; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  }
  return session;
}

export async function login(input: LoginInput): Promise<AuthSession> {
  if (useMocks) {
    await delay(null, 350);
    const known = mockUsers[input.email.toLowerCase()];
    if (!known || input.senha.length < 4) {
      throw new ApiError(400, "Email ou senha inválidos.");
    }
    return hydrateSession(known);
  }

  const session = await api.post<AuthSession>(
    "/api/auth/login/",
    { email: input.email, senha: input.senha },
    { anonymous: true },
  );
  return hydrateSession(session);
}

export function ensureSaasRole(user: AuthUser): void {
  if (!SAAS_ROLES.includes(user.role)) {
    throw new ApiError(
      403,
      "Acesso restrito a docentes. Use o aplicativo mobile.",
    );
  }
}

export async function cadastroEscola(
  input: CadastroEscolaInput,
): Promise<AuthSession> {
  if (useMocks) {
    await delay(null, 500);
    if (input.coordenador_senha.length < 8) {
      throw new ApiError(400, "Senha precisa ter pelo menos 8 caracteres.");
    }
    const session: AuthSession = {
      access_token: "mock-access-novo-coordenador",
      refresh_token: "mock-refresh-novo-coordenador",
      user: {
        id: 1000,
        email: input.coordenador_email,
        nome: input.coordenador_nome,
        role: "COORDENADOR",
        must_change_password: false,
        escola_id: 999,
        escola_nome: input.escola_nome,
      },
    };
    return hydrateSession(session);
  }
  const session = await api.post<AuthSession>(
    "/api/auth/cadastro-escola/",
    input,
    { anonymous: true },
  );
  return hydrateSession(session);
}

export async function trocarSenha(input: {
  senha_atual: string;
  nova_senha: string;
}): Promise<void> {
  if (useMocks) {
    await delay(null, 300);
    if (input.nova_senha.length < 8) {
      throw new ApiError(400, "Senha precisa ter pelo menos 8 caracteres.");
    }
    const current = userStorage.get<AuthUser>();
    if (current) {
      userStorage.set<AuthUser>({ ...current, must_change_password: false });
    }
    return;
  }
  await api.post("/api/auth/trocar-senha/", input);
}

export async function logout(): Promise<void> {
  if (!useMocks) {
    try {
      await api.post("/api/auth/logout/", {
        refresh_token: tokenStorage.getRefresh(),
      });
    } catch {
      /* ignore network errors on logout */
    }
  }
  tokenStorage.clear();
  if (typeof document !== "undefined") {
    document.cookie = "skillflow.session_hint=; Path=/; Max-Age=0; SameSite=Lax";
  }
}

export async function esqueciSenha(email: string): Promise<void> {
  if (useMocks) {
    await delay(null, 280);
    return;
  }
  await api.post("/api/auth/esqueci-senha/", { email }, { anonymous: true });
}

export async function resetSenha(token: string, nova_senha: string): Promise<void> {
  if (useMocks) {
    await delay(null, 320);
    if (nova_senha.length < 8) {
      throw new ApiError(400, "Senha precisa ter pelo menos 8 caracteres.");
    }
    return;
  }
  await api.post(
    "/api/auth/reset-senha/",
    { token, nova_senha },
    { anonymous: true },
  );
}

export function getStoredUser(): AuthUser | null {
  return userStorage.get<AuthUser>();
}

export const ROLE_LABEL: Record<UserRole, string> = {
  ALUNO: "Aluno",
  PROFESSOR: "Professor",
  COORDENADOR: "Coordenador",
  RESPONSAVEL: "Responsável",
};
