import {
  BarChart3,
  HeartHandshake,
  ScanLine,
  Sparkles,
} from "lucide-react";

type Feature = {
  icon: React.ElementType;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: ScanLine,
    title: "Professores livres da pilha de provas",
    description:
      "Avaliações corrigidas em segundos, com feedback por questão gerado automaticamente. Seu professor investe o tempo recuperado no que nenhuma IA substitui: estar presente para o aluno.",
  },
  {
    icon: BarChart3,
    title: "Decisões pedagógicas baseadas em dados",
    description:
      "Painel que mapeia dificuldades por disciplina e turma em tempo real. Identifique quem precisa de reforço e aja — antes que a nota caia e o aluno desengaje.",
  },
  {
    icon: Sparkles,
    title: "Avaliação nova em 3 minutos, não em 3 horas",
    description:
      "Descreva o tema, selecione o nível e a IA gera exercícios alinhados ao currículo — contextualizados, variados e prontos para publicar. Sem retrabalho.",
  },
  {
    icon: HeartHandshake,
    title: "Pais engajados, escola mais forte",
    description:
      "Responsáveis acompanham a evolução do filho em tempo real, por disciplina. Menos atrito nas reuniões, mais confiança na sua gestão — e mais renovações de matrícula.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-[#0B1628] text-white"
    >
      {/* Subtle top radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_45%_at_50%_0%,rgba(36,180,205,0.07)_0%,transparent_60%)]"
      />

      <div className="relative mx-auto max-w-6xl px-6 py-24">
        {/* Section header */}
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#24B4CD]">
              Por que líderes escolhem o SkillFlow
            </span>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-white md:text-4xl">
              Uma plataforma. Resultados visíveis desde o primeiro mês.
            </h2>
          </div>
          <p className="max-w-md text-sm text-slate-300">
            Cada perfil enxerga exatamente o que precisa — sem treinamento
            longo, sem curva de aprendizado.
          </p>
        </div>

        {/* Feature grid */}
        <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6">
          {features.map((feature) => {
            return (
              <li
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-8 md:p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#24B4CD]/30 shadow-xl"
              >
                {/* Icon */}
                <div className="mb-5 inline-flex rounded-xl p-3 bg-white/5">
                  <feature.icon size={20} className="text-[#24B4CD]" />
                </div>

                <h3 className="text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-slate-300">
                  {feature.description}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
