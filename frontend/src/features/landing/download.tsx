import { Apple, PlayCircle } from "lucide-react";
import Link from "next/link";

export function Download() {
  return (
    <section id="download" className="relative bg-[#F8FAFC] border-t border-slate-200 shadow-[inset_0_8px_20px_rgba(0,0,0,0.01)]">
      {/* Inner section top shadow for smoothing */}
      <div aria-hidden className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-slate-900/5 to-transparent pointer-events-none" />
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="glass overflow-hidden rounded-3xl border border-[#0E2A47]/10 bg-white">
          <div className="grid items-center gap-10 p-10 md:grid-cols-2 md:p-14">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-[#24B4CD]">
                App para alunos e famílias
              </span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0E2A47] md:text-4xl">
                Na palma da mão de cada aluno. Sem depender de Wi-Fi.
              </h2>
              <p className="mt-3 text-[#0E2A47]/75">
                Alunos respondem atividades mesmo sem internet. Pais
                acompanham o desempenho em tempo real. Notificações
                inteligentes — sem spam, sem ruído.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#"
                  aria-label="Baixar na Google Play (placeholder)"
                  className="group flex items-center gap-3 rounded-2xl border border-[#0E2A47]/15 bg-[#F8FAFC] px-5 py-3 transition-all hover:bg-[#24B4CD]/10"
                >
                  <PlayCircle className="text-[#24B4CD]" />
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wider text-[#0E2A47]/60">
                      Disponível em breve
                    </div>
                    <div className="text-sm font-medium text-[#0E2A47]">Google Play</div>
                  </div>
                </Link>
                <Link
                  href="#"
                  aria-label="Baixar na App Store (placeholder)"
                  className="group flex items-center gap-3 rounded-2xl border border-[#0E2A47]/15 bg-[#F8FAFC] px-5 py-3 transition-all hover:bg-[#24B4CD]/10"
                >
                  <Apple className="text-[#0E2A47]" />
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wider text-[#0E2A47]/60">
                      Disponível em breve
                    </div>
                    <div className="text-sm font-medium text-[#0E2A47]">App Store</div>
                  </div>
                </Link>
              </div>
            </div>

            <div className="relative isolate hidden md:block">
              <div className="glass-strong mx-auto h-[420px] w-[230px] rounded-[36px] border border-[#0E2A47]/10 bg-white p-3 shadow-[0_20px_50px_-20px_rgba(14,42,71,0.35)]">
                <div className="h-full rounded-[28px] border border-[#0E2A47]/10 bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between text-[10px] text-[#0E2A47]/65">
                    <span>09:41</span>
                    <span className="rounded-full bg-[#24B4CD]/20 px-2 py-0.5 text-[9px] uppercase text-[#0E2A47]">
                      offline
                    </span>
                  </div>
                  <div className="mt-4 text-xs text-[#0E2A47]/65">
                    Olá, Ana
                  </div>
                  <div className="text-base font-semibold text-[#0E2A47]">Boa tarde 👋</div>
                  <div className="mt-4 rounded-2xl bg-gradient-to-br from-white to-[#24B4CD]/20 p-4">
                    <div className="text-[10px] uppercase tracking-wider text-[#0E2A47]/60">
                      Média geral
                    </div>
                    <div className="mt-1 text-3xl font-semibold text-[#24B4CD]">
                      87
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-[#0E2A47]/10 p-3">
                    <div className="text-[11px] text-[#0E2A47]/65">
                      Próxima atividade
                    </div>
                    <div className="mt-1 text-xs font-medium text-[#0E2A47]">Funções · Prova</div>
                    <div className="mt-1 text-[10px] text-[#0E2A47]/65">
                      Prazo 05/05 · Peso 4
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="aspect-square rounded-lg bg-[#24B4CD]/15" />
                    <div className="aspect-square rounded-lg bg-[#0E2A47]/10" />
                    <div className="aspect-square rounded-lg bg-[#24B4CD]/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
