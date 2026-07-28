import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ToastViewport } from "@/components/ui/toast-viewport";
import { AdminSidebar } from "@/modules/admin/components/admin-sidebar";
import { AdminHeader } from "@/modules/admin/components/admin-header";
import { NotificacoesDocumentosLive } from "@/modules/admin/components/notificacoes-documentos-live";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(nextAuthOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <ToastViewport />
      <NotificacoesDocumentosLive />
      <AdminSidebar />
      <SidebarInset className="h-full min-h-0 overflow-hidden">
        <AdminHeader
          userName={session.user?.name ?? null}
          userEmail={session.user?.email ?? null}
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
