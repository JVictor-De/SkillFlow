"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  GraduationCap,
  Layers,
  LogOut,
  Menu,
  ScrollText,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/branding/logo";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL, logout } from "@/lib/auth";
import { cn, getInitials } from "@/lib/utils";
import type { AuthUser, UserRole } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{
    size?: number | string;
    className?: string;
  }>;
  roles?: UserRole[];
}

const items: NavItem[] = [
  { href: "/dashboard/turmas", label: "Turmas", icon: GraduationCap },
  { href: "/dashboard/atividades", label: "Atividades", icon: Layers },
  { href: "/dashboard/submissoes", label: "Submissões", icon: ClipboardList },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/alunos/cadastrar", label: "Cadastrar aluno", icon: Users },
  { href: "/dashboard/professores", label: "Professores", icon: ScrollText, roles: ["COORDENADOR"] },
  { href: "/dashboard/responsaveis", label: "Responsáveis", icon: ShieldCheck, roles: ["COORDENADOR"] },
];

export function DashboardSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = items.filter(
    (item) => !item.roles || item.roles.includes(user.role),
  );

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menu"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-30 inline-flex rounded-lg border border-white/10 bg-card/80 p-2 text-foreground backdrop-blur lg:hidden"
      >
        <Menu size={18} />
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/5 bg-[#0c0c14]/95 p-5 backdrop-blur transition-transform lg:translate-x-0 lg:static",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Navegação principal"
      >
        <div className="mb-6 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-1 text-gray-400 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav
          className="flex-1 space-y-1.5"
          aria-label="Seções do dashboard"
        >
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  // Tamanhos aumentados (text-base + ícone 22px) para
                  // melhorar legibilidade do menu principal sem quebrar
                  // a sidebar de 18rem (w-72) — testado em viewport ≥
                  // 320px para a versão mobile.
                  "group flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium leading-tight transition-colors",
                  isActive
                    ? "bg-gradient-brand-soft text-white border border-white/10"
                    : "text-gray-200 hover:bg-white/5 hover:text-white",
                )}
              >
                <item.icon
                  size={22}
                  className={cn(
                    "shrink-0",
                    isActive
                      ? "text-brand-300"
                      : "text-gray-400 group-hover:text-white",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          className="mt-6 rounded-2xl border border-white/5 bg-white/5 p-4 text-white"
          data-testid="sidebar-user-card"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-brand text-sm font-semibold text-white">
              {getInitials(user.nome ?? user.email)}
            </div>
            <div className="min-w-0">
              {/* Cor explícita branca em vez do `text-foreground` herdado
                  (que é navy escuro nesse tema) — garante contraste no
                  fundo escuro da sidebar. */}
              <div className="truncate text-sm font-medium text-white">
                {user.nome ?? user.email}
              </div>
              <div className="text-xs text-white/70">
                {ROLE_LABEL[user.role]}
                {user.escola_nome ? ` · ${user.escola_nome}` : ""}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start text-white hover:bg-white/10 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut size={14} />
            Sair
          </Button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          aria-hidden
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}
    </>
  );
}
