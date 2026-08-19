"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";

import { cn, getInitials } from "@/lib/utils";
import { Logo } from "@/components/branding/logo";
import { ROLE_LABEL, getStoredUser, logout } from "@/lib/auth";
import type { AuthUser, UserRole } from "@/types";

type NavLink = { href: string; label: string };

const links: NavLink[] = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/#cases", label: "Cases" },
  { href: "/contato", label: "Contato" },
];

const SAAS_ROLES: UserRole[] = ["PROFESSOR", "COORDENADOR"];

/**
 * Hook isolated em módulo do header para hidratação client-side.
 *
 * Antes, o header sempre mostrava "Log in / Agendar demonstração" mesmo
 * quando o usuário já estava logado — clicar na logo voltando do
 * dashboard parecia deslogar (bug 6 do briefing). Lemos a sessão
 * persistida em `userStorage` no primeiro frame do cliente. Se o usuário
 * for docente, mostramos "Painel" + avatar; alunos/responsáveis usam o
 * app mobile e seguem vendo o Log in.
 */
function useSessionHint(): { user: AuthUser | null; ready: boolean } {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setUser(getStoredUser());
    setReady(true);
  }, []);
  return { user, ready };
}

type SiteHeaderProps = {
  variant?: "overlay" | "solid";
};

export function SiteHeader({ variant = "overlay" }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isOverlay = variant === "overlay";
  const { user, ready } = useSessionHint();
  const showAuth = ready && user && SAAS_ROLES.includes(user.role);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const original = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : original;
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const wrapperClasses = cn(
    "z-40 w-full",
    isOverlay
      ? "absolute inset-x-0 top-0 glass-nav-overlay"
      : "relative bg-[#050D1A] text-white border-b border-white/[0.07]",
  );

  return (
    <header className={cn(wrapperClasses, open && "menu-open")}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:py-6">
        <Link
          href="/"
          aria-label="Educational AI — Página inicial"
          className="relative z-[1001] inline-flex items-center text-white transition-opacity hover:opacity-90"
        >
          <Logo />
        </Link>

        <nav
          aria-label="Principal"
          className="hidden items-center gap-8 text-base font-medium lg:flex text-white/90"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-[#24B4CD]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div
          className="hidden items-center gap-3 lg:flex"
          data-testid="site-header-actions"
        >
          {showAuth ? (
            <LoggedInActions user={user!} />
          ) : (
            <>
              {/* Log in — ghost style */}
              <Link
                href="/login"
                className="rounded-lg border border-white/40 px-4 py-2 text-sm font-medium text-white transition-all hover:border-white/60 hover:text-white"
              >
                Log in
              </Link>

              {/* Agendar demonstração — vibrant cyan CTA */}
              <Link
                href="#agendar-demo"
                className="btn-cyan rounded-lg px-4 py-2 text-sm font-semibold text-white"
              >
                Agendar demonstração
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "relative z-[1001] inline-flex h-11 w-11 items-center justify-center rounded-md transition-colors lg:hidden",
            open ? "text-white" : "text-[#24B4CD]",
          )}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      <MobileMenu
        open={open}
        onClose={() => setOpen(false)}
        loggedUser={showAuth ? user : null}
      />
    </header>
  );
}

function LoggedInActions({ user }: { user: AuthUser }) {
  async function handleLogout() {
    await logout();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }
  const display = user.nome ?? user.email;
  return (
    <>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/5 px-3 py-2 text-sm font-medium text-white transition-all hover:border-white/50 hover:bg-white/10"
        data-testid="site-header-dashboard"
      >
        <span
          aria-hidden="true"
          className="grid h-7 w-7 place-items-center rounded-full bg-gradient-brand text-[11px] font-semibold text-white"
        >
          {getInitials(display)}
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold">{display}</span>
          <span className="text-[10px] uppercase tracking-wider text-white/65">
            {ROLE_LABEL[user.role]}
          </span>
        </span>
        <LayoutDashboard size={16} className="text-white/80" />
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-3 py-2 text-sm font-medium text-white transition-all hover:border-white/50 hover:bg-white/10"
        data-testid="site-header-logout"
      >
        <LogOut size={14} />
        Sair
      </button>
    </>
  );
}

function MobileMenu({
  open,
  onClose,
  loggedUser,
}: {
  open: boolean;
  onClose: () => void;
  loggedUser: AuthUser | null;
}) {
  return (
    <div
      aria-hidden={!open}
      className={cn(
        "fixed inset-x-0 top-0 z-[99] origin-top transition-all duration-300 lg:hidden",
        "glass-dark-menu border-b",
        "shadow-[0_12px_48px_rgba(0,0,0,0.55)]",
        open
          ? "pointer-events-auto opacity-100 translate-y-0"
          : "pointer-events-none opacity-0 -translate-y-2",
      )}
    >
      <div className="flex flex-col gap-0 px-6 pb-8 pt-24">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="border-b border-white/[0.08] py-4 text-[1rem] font-medium uppercase tracking-[0.07em] text-white/80 transition-colors hover:text-[#24B4CD]"
          >
            {link.label}
          </Link>
        ))}

        <div className="mt-8 flex flex-col gap-3">
          {loggedUser ? (
            <>
              <div className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-white">
                <div className="text-[13px] font-semibold">
                  {loggedUser.nome ?? loggedUser.email}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-white/65">
                  {ROLE_LABEL[loggedUser.role]}
                </div>
              </div>
              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex items-center justify-center rounded-xl bg-[#24B4CD] px-5 py-3.5 text-[0.82rem] font-bold text-white shadow-[0_0_20px_rgba(36,180,205,0.35)]"
              >
                Ir para o painel
              </Link>
              <button
                type="button"
                onClick={async () => {
                  onClose();
                  await logout();
                  if (typeof window !== "undefined") {
                    window.location.href = "/";
                  }
                }}
                className="flex items-center justify-center rounded-xl border border-white/40 px-5 py-3.5 text-[0.82rem] font-medium text-white transition-colors hover:border-white/60"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="#agendar-demo"
                onClick={onClose}
                className="flex items-center justify-center rounded-xl bg-[#24B4CD] px-5 py-3.5 text-[0.82rem] font-bold text-white shadow-[0_0_20px_rgba(36,180,205,0.35)]"
              >
                Agendar demonstração
              </Link>
              <Link
                href="/login"
                onClick={onClose}
                className="flex items-center justify-center rounded-xl border border-white/40 px-5 py-3.5 text-[0.82rem] font-medium text-white transition-colors hover:border-white/60 hover:text-white"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
