"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Users,
  MessageCircle,
  CalendarDays,
  Archive,
  Search,
  UserCog,
  UsersRound,
  Mail,
  Webhook,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface AdminNavItem {
  label: string;
  href: string | null;
  icon: typeof ClipboardList;
}

interface AdminNavGrupo {
  label: string;
  itens: AdminNavItem[];
}

// Lista de itens extraída direto do produto real (print de referência,
// onboarding.flysakura.com/admin/onboarding/cadastros) — só "Cadastros"
// tem página construída aqui ainda; os demais aparecem (pra bater com a
// referência) mas ficam desabilitados até cada módulo existir de fato.
const GRUPOS_NAV: AdminNavGrupo[] = [
  {
    label: "Onboarding",
    itens: [
      { label: "Cadastros", href: "/painel", icon: ClipboardList },
      { label: "Atribuições", href: null, icon: Users },
      { label: "Atendimento", href: "/atendimento", icon: MessageCircle },
      { label: "Eventos", href: "/painel/eventos", icon: CalendarDays },
      { label: "Arquivo", href: "/arquivo", icon: Archive },
    ],
  },
  {
    label: "Ferramentas",
    itens: [{ label: "Consulta AMAT", href: null, icon: Search }],
  },
  {
    label: "Configurações",
    itens: [
      { label: "Usuários", href: "/painel/usuarios", icon: UserCog },
      { label: "Equipe", href: null, icon: UsersRound },
      { label: "Auditoria E-mails", href: null, icon: Mail },
      { label: "Messenger", href: "/painel/messenger", icon: Webhook },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Image
            src="/logos/logo-sakura-oficial.png"
            alt="Sakura Consolidadora"
            width={28}
            height={28}
            className="size-7 shrink-0 object-contain"
          />
          <span className="text-sidebar-foreground truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
            Sakura Admin
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {GRUPOS_NAV.map((grupo) => (
          <SidebarGroup key={grupo.label}>
            <SidebarGroupLabel>{grupo.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {grupo.itens.map((item) =>
                  item.href ? (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        isActive={
                          // "/painel" é prefixo de toda subrota (usuários,
                          // eventos, messenger) — só marca "Cadastros" ativo
                          // na rota exata, senão os dois ficam destacados
                          // juntos em qualquer página dentro de /painel.
                          item.href === "/painel"
                            ? pathname === "/painel"
                            : pathname.startsWith(item.href)
                        }
                        tooltip={item.label}
                        render={<Link href={item.href} />}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        disabled
                        tooltip={`${item.label} (em breve)`}
                        className="cursor-not-allowed opacity-50"
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ),
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
