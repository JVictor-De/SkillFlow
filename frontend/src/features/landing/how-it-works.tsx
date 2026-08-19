import {
  BookOpenText,
  Brain,
  Smartphone,
  UsersRound,
} from "lucide-react";

type Step = {
  icon: React.ElementType;
  title: string;
  description: string;
};

const steps: Step[] = [
  {
    icon: BookOpenText,
    title: "Professor monta a avaliação em minutos",
    description:
      "A IA sugere questões pelo tema. O professor revisa, ajusta e publica.",
  },
  {
    icon: Smartphone,
    title: "Aluno responde de onde estiver",
    description:
      "Offline com sincronização. Foto, texto ou múltipla escolha.",
  },
  {
    icon: Brain,
    title: "IA corrige e entrega feedback instantâneo",
    description:
      "A nota chega instantaneamente com feedback detalhado.",
  },
  {
    icon: UsersRound,
    title: "Família acompanha. Escola ganha reputação.",
    description:
      "Tempo real: família engajada, escola valorizada.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="relative overflow-hidden bg-[#050D1A] text-white"
    >
      {/* Subtle background radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_50%,rgba(36,180,205,0.06)_0%,transparent_70%)]"
      />

      <div className="relative mx-auto max-w-6xl px-6 py-24">
        {/* Section header */}
        <div className="mb-16 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#24B4CD]">
            Como funciona
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-white md:text-4xl">
            Implantado hoje. Resultados visíveis esta semana.
          </h2>
          <p className="mt-3 text-white/50">
            Seu professor gasta minutos. A plataforma entrega os resultados. Sua escola colhe os benefícios.
          </p>
        </div>

        {/* ── Desktop: horizontal timeline ── */}
        <div className="relative hidden lg:block">
          {/* Glowing connecting line */}
          <div
            aria-hidden
            className="timeline-line-h absolute left-[12.5%] right-[12.5%] top-[1.7rem]"
          />

          <ol className="grid grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <DesktopStepCard key={step.title} step={step} idx={idx} />
            ))}
          </ol>
        </div>

        {/* ── Mobile: vertical timeline ── */}
        <ol className="relative flex flex-col lg:hidden">
          {/* Vertical connecting line */}
          <div
            aria-hidden
            className="timeline-line-v absolute bottom-8 left-[1.7rem] top-8"
          />

          {steps.map((step, idx) => (
            <MobileStepCard
              key={step.title}
              step={step}
              idx={idx}
              isLast={idx === steps.length - 1}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

function DesktopStepCard({ step, idx }: { step: Step; idx: number }) {
  return (
    <li className="group flex flex-col items-center text-center">
      {/* Icon node — sits on the timeline line */}
      <div className="step-node relative z-[1] mb-7 flex h-[3.5rem] w-[3.5rem] items-center justify-center rounded-full">
        <step.icon size={22} className="text-[#24B4CD]" />
      </div>

      {/* Card */}
      <div className="card-dark w-full rounded-2xl p-5 transition-all duration-250">
        <span className="text-[0.85rem] font-bold uppercase tracking-[0.18em] text-[#24B4CD]/55">
          0{idx + 1}
        </span>
        <h3 className="mt-2.5 text-base font-semibold leading-snug text-white">
          {step.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-white/45">
          {step.description}
        </p>
      </div>
    </li>
  );
}

function MobileStepCard({
  step,
  idx,
  isLast,
}: {
  step: Step;
  idx: number;
  isLast: boolean;
}) {
  return (
    <li className={`group relative flex gap-5 ${isLast ? "pb-0" : "pb-10"}`}>
      {/* Icon node */}
      <div className="step-node relative z-[1] mt-0.5 flex h-[3.5rem] w-[3.5rem] shrink-0 items-center justify-center rounded-full">
        <step.icon size={20} className="text-[#24B4CD]" />
      </div>

      {/* Card */}
      <div className="card-dark flex-1 rounded-2xl p-5 transition-all duration-250">
        <span className="text-[0.85rem] font-bold uppercase tracking-[0.18em] text-[#24B4CD]/55">
          0{idx + 1}
        </span>
        <h3 className="mt-1.5 text-base font-semibold text-white">
          {step.title}
        </h3>
        <p className="mt-1.5 text-base leading-relaxed text-white/45">
          {step.description}
        </p>
      </div>
    </li>
  );
}
