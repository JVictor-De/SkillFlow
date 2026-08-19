import { Activity, Brain, CheckCircle2, Clock } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#F8FAFC] border-t border-slate-200 shadow-[inset_0_8px_20px_rgba(0,0,0,0.01)]">
      <div aria-hidden className="absolute inset-0 grid-bg opacity-30" />
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28">

        <div className="relative z-10 animate-fade-in">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#24B4CD]">
            Painel do gestor
          </span>

          <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-[#0E2A47] md:text-4xl">
            Dados pedagógicos em tempo real —{" "}
            <span className="text-[#24B4CD]">sem relatórios manuais.</span>
          </h2>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            A cada correção automática, o painel atualiza desempenho por turma,
            taxa de acerto por disciplina e alunos que precisam de atenção.
            Sua equipe chega às reuniões com evidências, não com intuições.
          </p>

          <ul className="mt-7 space-y-3 text-sm text-[#0E2A47]/70">
            {[
              "Desempenho por turma e por disciplina atualizado ao vivo",
              "Identificação automática de erros recorrentes por categoria",
              "Relatórios prontos para reuniões pedagógicas e conselhos de classe",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckCircle2
                  size={15}
                  className="mt-0.5 shrink-0 text-[#24B4CD]"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative isolate min-h-[480px] animate-fade-in lg:ml-auto">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-[28px] bg-gradient-to-br from-[#F8FAFC] via-[#FFFFFF] to-[#24B4CD]/20 blur-2xl"
      />

      <div className="glass relative ml-6 max-w-md rounded-[26px] border border-[#0E2A47]/10 bg-white/85 p-5 shadow-[0_30px_120px_-40px_rgba(14,42,71,0.35)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-[#24B4CD] animate-pulse" />
            Dashboard · 9º Ano A
          </div>
          <span className="rounded-full bg-[#F8FAFC] px-2 py-1 text-xs text-[#0E2A47]/70">
            Tempo real
          </span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <MetricCard
            icon={<Activity size={14} />}
            label="Submissões"
            value="184"
            trend="+12%"
            tone="indigo"
          />
          <MetricCard
            icon={<Brain size={14} />}
            label="IA acertou"
            value="92%"
            trend="+3pp"
            tone="violet"
          />
          <MetricCard
            icon={<Clock size={14} />}
            label="Tempo médio"
            value="2.1m"
            trend="-18%"
            tone="emerald"
          />
        </div>

        <div className="mt-5 rounded-2xl border border-[#0E2A47]/10 bg-[#F8FAFC] p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Erros por categoria</span>
            <span className="text-muted-foreground">7 dias</span>
          </div>
          <div className="mt-3 space-y-2">
            {[
              { name: "Interpretação", value: 78 },
              { name: "Cálculo", value: 56 },
              { name: "Concordância", value: 38 },
              { name: "Contexto histórico", value: 22 },
            ].map((row) => (
              <div key={row.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{row.name}</span>
                  <span>{row.value}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#0E2A47]/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0E2A47] to-[#24B4CD]"
                    style={{ width: `${row.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass absolute -bottom-2 right-0 w-44 rounded-[26px] border border-[#0E2A47]/10 bg-white/90 p-3 shadow-[0_20px_55px_-25px_rgba(14,42,71,0.35)] lg:w-56">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Atividades</span>
            <span className="rounded-full bg-[#24B4CD]/20 px-2 py-0.5 text-[10px] uppercase text-[#0E2A47]">
              Online
            </span>
          </div>
          <p className="mt-3 text-xs font-medium text-foreground">
            Revolução Industrial
          </p>
          <p className="text-[10px] text-muted-foreground">
            5 questões · Prazo 30/04
          </p>

          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#0E2A47]/10">
              <div className="h-full w-[80%] rounded-full bg-gradient-to-r from-[#0E2A47] to-[#24B4CD]" />
            </div>
            <span className="text-[10px] text-muted-foreground">4/5</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <div className="aspect-square rounded-lg bg-[#24B4CD]/15" />
          <div className="aspect-square rounded-lg bg-[#0E2A47]/10" />
          <div className="aspect-square rounded-lg bg-[#24B4CD]/20" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  trend,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  tone: "indigo" | "violet" | "emerald";
}) {
  const toneClass: Record<typeof tone, string> = {
    indigo: "bg-[#0E2A47]/10 text-[#0E2A47]",
    violet: "bg-[#24B4CD]/15 text-[#0E2A47]",
    emerald: "bg-[#24B4CD]/20 text-[#0E2A47]",
  };
  return (
    <div className="rounded-xl border border-[#0E2A47]/10 bg-white p-3">
      <div className={`mb-2 inline-flex rounded-md p-1.5 ${toneClass[tone]}`}>
        {icon}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-lg font-semibold">{value}</span>
        <span className="text-[10px] text-[#24B4CD]">{trend}</span>
      </div>
    </div>
  );
}
