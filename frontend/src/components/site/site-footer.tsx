import Link from "next/link";

import { Logo } from "@/components/branding/logo";

const footerCols: { title: string; items: { label: string; href: string }[] }[] = [
  {
    title: "Plataforma",
    items: [
      { label: "Como funciona", href: "/#como-funciona" },
      { label: "Funcionalidades", href: "/#features" },
      { label: "Planos", href: "/#planos" },
    ],
  },
  {
    title: "Para Escolas",
    items: [
      { label: "Cadastrar escola", href: "/cadastro-escola" },
      { label: "Agendar demonstração", href: "#agendar-demo" },
      { label: "Entrar como docente", href: "/login" },
    ],
  },
  {
    title: "Contatos",
    items: [
      { label: "hello@educationalai.dev", href: "mailto:hello@educationalai.dev" },
      { label: "Política de privacidade", href: "#" },
      { label: "Termos de uso", href: "#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#050D1A] pb-10 pt-20 font-body text-white">
      <div className="mx-auto max-w-6xl px-6">
        {/* Main grid */}
        <div className="grid gap-12 border-b border-white/[0.06] pb-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <Logo />
            <p className="mt-5 max-w-[17rem] text-sm leading-relaxed text-white/42">
              Ecossistema educacional B2B com correção automatizada por IA e
              portal integrado para pais e professores. Tecnologia que devolve
              tempo à equipe pedagógica.
            </p>
          </div>

          {/* Nav columns */}
          {footerCols.map((col) => (
            <div key={col.title}>
              <h4 className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-white/32">
                {col.title}
              </h4>
              <ul className="mt-5 space-y-3.5 text-sm">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-white/52 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-start justify-between gap-4 text-xs text-white/28 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Educational AI · Todos os direitos reservados.</span>
          <span>Construído com cuidado para escolas que abraçam a inovação.</span>
        </div>
      </div>
    </footer>
  );
}
