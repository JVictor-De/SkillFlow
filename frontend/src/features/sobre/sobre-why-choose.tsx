import { SectionBadge } from "@/components/site/section-badge";
import { UnifiedButton } from "@/components/site/unified-button";

const WHY_IMAGE =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80";

const points = [
  "Diagnóstico cirúrgico da operação pedagógica e da rotina de correção dos professores.",
  "Mentoria especializada para diretores, coordenadores e mantenedores escolares.",
  "Modelagem de processos com IA e preparação para escala segura, mantendo o cuidado humano.",
];

export function SobreWhyChoose() {
  return (
    <section className="bg-white py-24 font-body text-wpa-darker md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="flex justify-center">
            <SectionBadge tone="light" align="center">
              Por que escolher a SkillFlow?
            </SectionBadge>
          </div>
          <h2 className="mt-4 font-heading text-[clamp(2rem,4vw,3rem)] font-light text-wpa-darker">
            A escolha mais inteligente
          </h2>
        </div>

        <div className="relative grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative z-[2]">
            <h3 className="font-heading text-[clamp(1.5rem,2.6vw,2rem)] font-light leading-tight">
              <span className="text-wpa-primary">Impulsionando</span> o<br />
              crescimento da sua
              <br />
              escola.
            </h3>

            <ul className="mt-8 space-y-4">
              {points.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-sm leading-relaxed text-wpa-gray"
                >
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-wpa-gray-soft" />
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <UnifiedButton variant="primary" href="/contato">
                Solicite um diagnóstico
              </UnifiedButton>
            </div>
          </div>

          <div className="relative pl-0 lg:pl-12">
            <span
              aria-hidden
              className="absolute left-0 top-1/2 hidden h-px w-20 -translate-y-1/2 bg-wpa-gray-soft lg:block"
            />
            <span
              aria-hidden
              className="absolute left-12 top-1/2 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-wpa-gray-soft lg:block"
            />

            <div className="relative overflow-hidden rounded border-[10px] border-wpa-light bg-wpa-light shadow-[0_20px_40px_rgba(0,0,0,0.05)]">
              <div
                role="img"
                aria-label="Equipe SkillFlow trabalhando em planejamento pedagógico"
                className="aspect-[4/3] w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${WHY_IMAGE})` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
