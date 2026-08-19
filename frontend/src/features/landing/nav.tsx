"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/branding/logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#features", label: "Funcionalidades" },
  { href: "#provas", label: "Quem usa" },
  { href: "#download", label: "Baixar app" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#0E2A47]/10 bg-white/78 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="Página inicial SkillFlow">
          <Logo />
        </Link>

        <nav
          aria-label="Principal"
          className="hidden items-center gap-7 text-sm text-[#0E2A47]/75 md:flex"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="transition-colors hover:text-[#24B4CD]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            asChild
            size="sm"
            className="text-[#0E2A47]/75 hover:bg-[#0E2A47]/5 hover:text-[#0E2A47]"
          >
            <Link href="/login">Fazer login</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-gradient-to-r from-[#0E2A47] to-[#24B4CD] text-white shadow-sm hover:opacity-90"
          >
            <Link href="/cadastro-escola">Criar conta</Link>
          </Button>
        </div>

        <button
          type="button"
          aria-label="Abrir menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="focus-ring md:hidden rounded-lg p-2 text-[#0E2A47]/70"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div
        className={cn(
          "glass-dark-menu border-b md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 pb-6">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-white/75 transition-colors hover:text-white"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              asChild
              className="w-full bg-gradient-to-r from-[#0E2A47] to-[#24B4CD] text-white shadow-sm hover:opacity-90"
            >
              <Link href="/cadastro-escola">Criar conta</Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="w-full border-white/20 bg-transparent text-white/85 hover:border-white/35 hover:bg-white/10 hover:text-white"
            >
              <Link href="/login">Fazer login</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
