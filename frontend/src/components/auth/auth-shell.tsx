import Link from "next/link";

import { Logo } from "@/components/branding/logo";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="relative grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden bg-gradient-radial p-10 lg:flex lg:flex-col lg:justify-between">
        <Link href="/" aria-label="Voltar para a home">
          <Logo />
        </Link>
        <div className="grid-bg absolute inset-0 -z-10 opacity-50" />
        <div className="relative max-w-md">
          <h2 className="text-2xl font-semibold leading-tight">
            Educação com IA, sem fricção.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Use o SkillFlow para corrigir atividades automaticamente, gerar
            insights da sua turma e dar tempo de qualidade aos alunos.
          </p>

          <div className="glass mt-8 rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Acesso de docente
            </div>
            <p className="mt-1 text-sm">
              Coordenadores e professores acessam aqui. Alunos e responsáveis
              utilizam o aplicativo mobile.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} SkillFlow
        </p>
      </div>

      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/" aria-label="Voltar para a home">
              <Logo />
            </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm">{footer}</div>}
        </div>
      </div>
    </main>
  );
}
