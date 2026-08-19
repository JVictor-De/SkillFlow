import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { TrocarSenhaForm } from "@/features/auth/trocar-senha-form";

export const metadata: Metadata = {
  title: "Trocar senha",
  description: "Troque sua senha provisória para acessar o SkillFlow.",
};

export default function TrocarSenhaPage() {
  return (
    <AuthShell
      title="Defina uma nova senha"
      description="Você está usando uma senha provisória. Crie uma senha forte para continuar."
    >
      <TrocarSenhaForm />
    </AuthShell>
  );
}
