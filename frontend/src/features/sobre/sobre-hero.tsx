import { SectionBadge } from "@/components/site/section-badge";

const SOBRE_BACKDROP =
"https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1920&q=80";

export function SobreHero() {
  return (
    <section
      aria-label="Sobre a SkillFlow"
      className="relative w-full overflow-hidden bg-wpa-darker text-white"
      style={{ minHeight: "min(80vh, 720px)" }}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${SOBRE_BACKDROP})` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/10"
      />

      <div className="relative z-[2] mx-auto flex min-h-[80vh] max-w-6xl items-center px-6 pb-20 pt-44 lg:pt-48">
        <div className="max-w-2xl animate-fade-in-up">
          <h1 className="font-heading text-[clamp(2.4rem,5.5vw,4.5rem)] font-medium leading-[1.05] tracking-tight">
            Acelerando
            <br />
            <span className="my-2 inline-block rounded-full border-2 border-wpa-primary px-7 py-1 font-light text-wpa-primary text-[clamp(1.8rem,4.4vw,3.4rem)]">
              escolas
            </span>
            <br />
            com IA
          </h1>

          <div className="mt-12">
            <SectionBadge tone="dark">Movidos por uma visão</SectionBadge>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
              No centro da SkillFlow está um time pedagógico-tecnológico que
              entende a fundo a rotina de uma escola e constrói, lado a lado
              com diretores e coordenadores, a infraestrutura de IA que
              viabilizará o ensino do amanhã.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
