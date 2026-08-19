import Link from "next/link";

import { Logo } from "@/components/branding/logo";

const cols: { title: string; items: { label: string; href: string }[] }[] = [
  {
    title: "Produto",
    items: [
      { label: "Como funciona", href: "#como-funciona" },
      { label: "Funcionalidades", href: "#features" },
      { label: "Quem usa", href: "#provas" },
      { label: "Baixar app", href: "#download" },
    ],
  },
  {
    title: "Para escolas",
    items: [
      { label: "Cadastrar escola", href: "/cadastro-escola" },
      { label: "Entrar como docente", href: "/login" },
      { label: "Agendar demonstração", href: "#agendar-demo" },
    ],
  },
  {
    title: "Contato",
    items: [
      { label: "hello@skillflow.dev", href: "mailto:hello@skillflow.dev" },
      { label: "Política de privacidade", href: "#" },
      { label: "Termos de uso", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#2E3338]">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-white/55">
              Automatize a operação pedagógica da sua escola. Devolva tempo
              aos professores e dados precisos aos gestores.
            </p>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-medium uppercase tracking-wider text-white/45">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-white/70 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/[0.08] pt-6 text-xs text-white/40 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} SkillFlow · Todos os direitos reservados.</span>
          <span>Construído com 💜 para escolas que abraçam IA com cuidado.</span>
        </div>
      </div>
    </footer>
  );
}
