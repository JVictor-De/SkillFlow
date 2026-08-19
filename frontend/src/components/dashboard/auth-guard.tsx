"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ensureSaasRole, getStoredUser } from "@/lib/auth";
import type { AuthUser } from "@/types";

interface AuthGuardProps {
  children: (user: AuthUser) => React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    try {
      ensureSaasRole(stored);
    } catch {
      router.replace("/login");
      return;
    }
    if (stored.must_change_password) {
      router.replace("/trocar-senha");
      return;
    }
    setUser(stored);
    setReady(true);
  }, [router]);

  if (!ready || !user) {
    return (
      <div
        role="status"
        aria-label="Carregando sessão"
        className="grid h-screen place-items-center text-sm text-muted-foreground"
      >
        Carregando sessão...
      </div>
    );
  }
  return <>{children(user)}</>;
}
