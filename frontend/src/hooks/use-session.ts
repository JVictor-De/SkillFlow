"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getStoredUser, logout as performLogout } from "@/lib/auth";
import type { AuthUser } from "@/types";

export function useSession(options?: { redirectTo?: string }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setLoading(false);
    if (!stored && options?.redirectTo) {
      router.replace(options.redirectTo);
    }
  }, [options?.redirectTo, router]);

  const logout = useCallback(async () => {
    await performLogout();
    setUser(null);
    router.replace("/login");
  }, [router]);

  return { user, loading, logout, setUser };
}
