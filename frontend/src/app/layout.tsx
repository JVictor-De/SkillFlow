import type { Metadata, Viewport } from "next";
import { DM_Sans, Inter, Manrope } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700", "800"],
  variable: "--font-heading",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: {
    default: "SkillFlow — Plataforma SaaS de educação com IA",
    template: "%s · SkillFlow",
  },
  description:
    "Transforme a educação da sua escola: correção automática por IA, app offline-first para alunos, analytics de turma e boletim para responsáveis em uma plataforma única.",
  keywords: [
    "edtech",
    "educação",
    "inteligência artificial",
    "correção automática",
    "boletim digital",
    "analytics escolar",
  ],
  authors: [{ name: "SkillFlow" }],
  openGraph: {
    title: "SkillFlow — Plataforma SaaS de educação com IA",
    description:
      "Correção automática por IA, app offline-first e analytics de turma para escolas modernas.",
    type: "website",
    locale: "pt_BR",
    siteName: "SkillFlow",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillFlow — Plataforma SaaS de educação com IA",
    description:
      "Correção automática por IA, app offline-first e analytics de turma.",
  },
  metadataBase: new URL("https://app.skillflow.dev"),
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${manrope.variable} ${dmSans.variable}`}
    >
      <body className="min-h-screen antialiased">
        <div id="app-root" className="relative z-0 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
