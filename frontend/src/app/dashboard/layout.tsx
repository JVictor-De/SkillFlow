"use client";

import { AuthGuard } from "@/components/dashboard/auth-guard";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      {(user) => (
        <div className="relative flex min-h-screen lg:flex-row">
          <DashboardSidebar user={user} />
          <main className="relative flex-1 px-5 py-8 sm:px-8 lg:px-10">
            {children}
          </main>
        </div>
      )}
    </AuthGuard>
  );
}
