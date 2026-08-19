import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { CadastroEscolaForm } from "@/features/auth/cadastro-escola-form";

export const metadata: Metadata = {
  title: "Cadastrar minha escola",
  description: "Crie a conta da escola e do coordenador no SkillFlow.",
};

export default function CadastroEscolaPage() {
  return (
    <AuthShell
      title="Cadastrar minha escola"
      description="Cadastre a escola e a primeira conta de Coordenador/Diretor. A criação acontece em uma única transação."
      footer={
        <p className="text-muted-foreground">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Entrar como docente
          </Link>
        </p>
      }
    >
      <CadastroEscolaForm />
    </AuthShell>
  );
}
