import type { Metadata } from "next";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { ContatoHero } from "@/features/contato/contato-hero";
import { ContatoSection } from "@/features/contato/contato-section";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com o time SkillFlow e descubra como modernizar a correção de exercícios e a comunicação com pais e professores.",
  alternates: { canonical: "https://app.skillflow.dev/contato" },
};

export default function ContatoPage() {
  return (
    <>
      <div className="relative">
        <SiteHeader />
        <main>
          <ContatoHero />
          <ContatoSection />
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
