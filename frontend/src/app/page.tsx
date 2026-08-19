import type { Metadata } from "next";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Cases } from "@/features/landing/cases";
import { Download } from "@/features/landing/download";
import { Features } from "@/features/landing/features";
import { FinalCTA } from "@/features/landing/final-cta";
import { Hero } from "@/features/landing/hero";
import { HeroWpa } from "@/features/landing/hero-wpa";
import { HowItWorks } from "@/features/landing/how-it-works";
import { Testimonials } from "@/features/landing/testimonials";

export const metadata: Metadata = {
  title: "SkillFlow — Educação com IA, app offline e analytics em tempo real",
  description:
    "Transforme a educação da sua escola com correção automática por IA, app offline-first para alunos, analytics de turma e boletim para responsáveis.",
  alternates: { canonical: "https://app.skillflow.dev/" },
};

export default function HomePage() {
  return (
    <div className="relative bg-white text-[#1A1A1B]">
      <div className="relative">
        <SiteHeader />
        <main>
          <HeroWpa />
          <Cases />
          <Features />
          <Hero />
          <Download />
          <HowItWorks />
          <Testimonials />
          <FinalCTA />
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
