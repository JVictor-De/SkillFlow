import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section id="agendar-demo" className="relative bg-slate-100 border-t border-slate-200">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="glass relative overflow-hidden rounded-3xl border border-[#0E2A47]/10 bg-white p-10 text-center md:p-16 shadow-lg">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-br from-[#F8FAFC] via-white to-[#24B4CD]/20 opacity-90"
          />
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Veja o SkillFlow em ação e comprove os resultados.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Cadastre sua escola e agende uma demonstração gratuita em minutos.
            Sua equipe pedagógica começa a usar em até 48h — sem contratos longos,
            sem implantação complicada.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="group bg-[#24B4CD] text-white hover:bg-[#209fb5] px-8"
            >
              <Link href="/cadastro-escola">
                Agendar demonstração gratuita
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-0.5 ml-2"
                />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-8"
            >
              <Link href="/cadastro-escola">Criar conta gratuita</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
