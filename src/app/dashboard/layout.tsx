import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { LogoutButton } from "@/modules/auth/components/logout-button";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(nextAuthOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <span className="text-sm font-semibold text-slate-900">Cadastro IA Sakura</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{session.user?.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex flex-1 justify-center px-6 py-10">{children}</main>
    </div>
  );
}
