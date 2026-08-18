"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { UserMenu } from "@/modules/auth/components/user-menu";

interface AdminHeaderProps {
  userName: string | null;
  userEmail: string | null;
}

// Rótulos das páginas do Admin pro breadcrumb "Sakura · {Página}" — cada
// página nova entra aqui conforme for sendo construída.
const ROTULOS_PAGINA: Record<string, string> = {
  "/crm/dashboard-new": "Dashboard (novo)",
  "/crm/gestores": "Gestores",
  "/crm/executivos": "Executivos",
  "/crm/agencias": "Agências",
  "/crm/novas-agencias": "Análise de Novas Agências",
  "/dashboard": "Dashboard",
  "/cadastros/usuarios": "Usuários",
  "/cadastros/messenger": "Messenger",
  "/cadastros/eventos": "Eventos",
  "/cadastros": "Cadastros",
  "/arquivo": "Arquivo",
  "/atendimento": "Atendimento",
  "/atribuicoes": "Atribuições",
};

function rotuloDaPagina(pathname: string): string {
  const rota = Object.keys(ROTULOS_PAGINA).find((rota) => pathname.startsWith(rota));
  return rota ? ROTULOS_PAGINA[rota]! : "Admin";
}

export function AdminHeader({ userName, userEmail }: AdminHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="border-border bg-card flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-5" />
        <span className="text-foreground text-sm font-semibold">
          Sakura · {rotuloDaPagina(pathname)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <UserMenu userName={userName} userEmail={userEmail} />
      </div>
    </header>
  );
}
