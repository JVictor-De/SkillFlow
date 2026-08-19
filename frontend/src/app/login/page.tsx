import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse a plataforma SkillFlow para professores e coordenadores.",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Entrar"
      description="Plataforma exclusiva para professores e coordenadores. Alunos e responsáveis usam o aplicativo mobile."
      footer={
        <div className="flex items-center justify-between text-muted-foreground">
          <Link
            href="/esqueci-senha"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Esqueci minha senha
          </Link>
          <Link
            href="/cadastro-escola"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Cadastrar minha escola
          </Link>
        </div>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
