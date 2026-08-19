import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { SectionBadge } from "@/components/site/section-badge";

const HERO_BACKDROP =
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";

export function HeroWpa() {
  return (
    <section
      aria-label="Hero principal Educational AI"
      className="relative min-h-[92vh] w-full overflow-hidden bg-[#050D1A] text-white"
    >
      {/* Background image — anchors the layout on the right for widescreen */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-right-top md:bg-right opacity-35"
        style={{ backgroundImage: `url(${HERO_BACKDROP})` }}
      />

      {/* Deep navy overlay — directional gradient for depth and readability on the left */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-[#050D1A] via-[#050D1A]/80 to-[#24B4CD]/20"
      />

      {/* AI accent glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-[55%] w-[45%] bg-[radial-gradient(ellipse_at_top_left,rgba(36,180,205,0.14)_0%,transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-[40%] w-[35%] bg-[radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.10)_0%,transparent_65%)]"
      />

      <div className="relative z-[2] mx-auto flex min-h-[92vh] max-w-6xl flex-col items-stretch gap-12 px-6 pb-20 pt-44 lg:flex-row lg:items-center lg:justify-between lg:pt-52">

        {/* ── Content block ── */}
        <div className="max-w-xl animate-fade-in-up">
          <SectionBadge tone="primary">A plataforma que líderes escolares escolhem</SectionBadge>

          <h1 className="mt-5 font-heading text-[clamp(2.4rem,5.5vw,4.4rem)] font-bold leading-[1.05] tracking-tight text-white">
            Menos correção.
            <br className="hidden sm:block" />
            <span className="text-gradient-bright">Mais impacto</span>{" "}pedagógico.
          </h1>

          <p className="mt-6 max-w-[26rem] text-sm md:text-base leading-relaxed text-white/80 md:text-[1.05rem]">
            Enquanto seus professores corrigem provas manualmente, escolas
            concorrentes já automatizaram. <span className="hidden sm:inline">O SkillFlow devolve 15h semanais ao
            seu corpo docente — e coloca dados reais na mesa dos gestores.</span>
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {/* Primary CTA — vibrant cyan with glow */}
            <Link
              href="#agendar-demo"
              className="group btn-cyan inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold"
            >
              Agendar demonstração gratuita
              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>

            {/* Secondary CTA — ghost outline cyan */}
            <Link
              href="#como-funciona"
              className="btn-ghost-cyan inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold"
            >
              Ver a plataforma em ação
            </Link>
          </div>

          <ul className="mt-8 grid gap-2.5 text-sm text-white/60 sm:grid-cols-3">
            {["Correção automática por IA", "Painel de desempenho em tempo real", "Funciona sem internet"].map(
              (item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0 text-[#24B4CD]" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>

        {/* ── Stats glass card ── */}
        <HeroGlassCard />
      </div>
    </section>
  );
}

function HeroGlassCard() {
  return (
    <aside
      className="relative w-full max-w-sm self-end rounded-md border border-white/15 bg-white/10 p-9 backdrop-blur-md animate-fade-in lg:mt-12 lg:self-auto"
      aria-label="Resultado da plataforma"
    >
      <SectionBadge tone="primary">Instituições parceiras</SectionBadge>

      <div className="mt-3 font-heading text-[3.4rem] font-medium leading-none text-wpa-primary">
        +120
      </div>
      <p className="mt-3 text-sm leading-relaxed text-white/75">
        Instituições que já transformaram sua gestão pedagógica, devolveram
        horas ao corpo docente e passaram a tomar decisões com dados reais.
      </p>
    </aside>
  );
}
