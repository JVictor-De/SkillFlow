import { SectionBadge } from "@/components/site/section-badge";

const CONTATO_BACKDROP =
  "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1920&q=80";

export function ContatoHero() {
  return (
    <section
      aria-label="Fale com a SkillFlow"
      className="relative w-full overflow-hidden bg-wpa-darker text-white"
      style={{ minHeight: "min(80vh, 720px)" }}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${CONTATO_BACKDROP})` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-black/5"
      />

      <div className="relative z-[2] mx-auto flex min-h-[80vh] max-w-6xl items-center px-6 pb-20 pt-44 lg:pt-48">
        <div className="max-w-2xl animate-fade-in-up">
          <h1 className="font-heading text-[clamp(2.4rem,5.5vw,4.5rem)] font-medium leading-[1.05] tracking-tight">
            Pronto para dar
            <br />o próximo
            <br />
            <span className="text-wpa-primary">passo?</span>
          </h1>

          <div className="relative mt-12 max-w-lg">
            <SectionBadge tone="dark">Vamos começar a conversa</SectionBadge>
            <p className="mt-4 text-base leading-relaxed text-white/75 md:text-lg">
              Se você é diretor, mantenedor ou coordenador e quer entender como
              a SkillFlow pode automatizar a correção de exercícios e
              modernizar a comunicação com pais e professores, nosso time está
              pronto para conversar com você.
            </p>

            <span
              aria-hidden
              className="absolute right-[-60px] top-[70px] hidden h-px w-32 bg-white/40 lg:block"
            />
            <span
              aria-hidden
              className="absolute right-[-60px] top-[67px] hidden h-1.5 w-1.5 rounded-full bg-white/60 lg:block"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
