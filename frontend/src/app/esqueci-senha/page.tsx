import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { EsqueciSenhaForm } from "@/features/auth/esqueci-senha-form";

export const metadata: Metadata = {
  title: "Esqueci minha senha",
  description: "Recupere o acesso à plataforma SkillFlow.",
};

export default function EsqueciSenhaPage() {
  return (
    <AuthShell
      title="Recuperar acesso"
      description="Informe o email cadastrado para receber um token de redefinição."
      footer={
        <p className="text-muted-foreground">
          Já lembrou da senha?{" "}
          <Link
            href="/login"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </p>
      }
    >
      <EsqueciSenhaForm />
    </AuthShell>
  );
}
