import { AvatarStack } from "@/components/site/avatar-stack";
import { SectionBadge } from "@/components/site/section-badge";

const teamAvatars = [
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop",
];

export function SobreIntro() {
  return (
    <section className="bg-white py-24 font-body text-wpa-darker md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-[1fr_2.5fr] md:gap-12">
          <div>
            <SectionBadge tone="light">Sobre nós</SectionBadge>
          </div>

          <div>
            <h2 className="font-heading text-[clamp(1.6rem,3.2vw,2.5rem)] font-light leading-[1.3] text-wpa-darker md:text-[2.4rem]">
              <strong className="font-bold">Nossa atuação</strong> combina
              experiência pedagógica, IA aplicada e governança escolar com uma
              visão estratégica do dia a dia da diretoria, apoiando donos e
              gestores na tomada de decisões estruturantes para o futuro da
              instituição.
            </h2>

            <div className="mt-10 flex flex-col items-start justify-between gap-6 border-t border-wpa-gray-soft pt-6 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <AvatarStack images={teamAvatars} size={42} borderColor="#fff" />
                <div>
                  <strong className="block text-sm">
                    Mais de 300 educadores
                  </strong>
                  <span className="text-xs text-wpa-gray">
                    Soluções que elevam o aprendizado das nossas escolas.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
