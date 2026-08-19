import type { Metadata } from "next";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SobreHero } from "@/features/sobre/sobre-hero";
import { SobreImageBand } from "@/features/sobre/sobre-image-band";
import { SobreIntro } from "@/features/sobre/sobre-intro";
import { SobreLogosGrid } from "@/features/sobre/sobre-logos-grid";
import { SobreWhyChoose } from "@/features/sobre/sobre-why-choose";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Conheça a SkillFlow: ecossistema educacional B2B com correção automatizada por IA e portal integrado para pais e professores.",
  alternates: { canonical: "https://app.skillflow.dev/sobre" },
};

export default function SobrePage() {
  return (
    <>
      <div className="relative">
        <SiteHeader />
        <main>
          <SobreHero />
          <SobreIntro />
          <SobreLogosGrid />
          <SobreWhyChoose />
          <SobreImageBand />
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
