import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ToastViewport } from "@/components/ui/toast-viewport";
import { AdminSidebar } from "@/modules/admin/components/admin-sidebar";
import { AdminHeader } from "@/modules/admin/components/admin-header";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(nextAuthOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <ToastViewport />
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader
          userName={session.user?.name ?? null}
          userEmail={session.user?.email ?? null}
        />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
