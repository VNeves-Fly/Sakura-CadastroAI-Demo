"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart2,
  ClipboardList,
  Users,
  MessageCircle,
  CalendarDays,
  Archive,
  UserCog,
  Webhook,
  ShieldCheck,
  UserPlus,
  MapPin,
  Building2,
  Store,
  FileSignature,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Cargo } from "@/modules/users/domain/enums";
import { useAtendimentoNaoLidasStore } from "@/modules/atendimento/stores/atendimento-nao-lidas.store";

interface AdminNavItem {
  label: string;
  href: string | null;
  icon: typeof ClipboardList;
  // Ausente = visível pra todo cargo. Gestor/Executivo (2026-08-03) só
  // acompanham cadastros — sem acesso às demais ferramentas internas.
  ocultoPara?: Cargo[];
}

interface AdminNavGrupo {
  label: string;
  itens: AdminNavItem[];
}

const ROTAS_EXATAS = new Set(["/cadastros", "/dashboard"]);

const CARGOS_INTERNOS_APENAS: Cargo[] = ["GESTOR", "EXECUTIVO"];
// "Gestores" só pra quem pode cadastrar Gestor (decisão do usuário,
// 2026-08-03) — Admin/Diretor, ninguém mais.
const CARGOS_NAO_ADMIN: Cargo[] = ["ANALISTA", "GESTOR", "EXECUTIVO"];
// "Executivos" (/executivos, internamente "Promotor") — Admin/Diretor
// cadastram qualquer um, Gestor só os seus; Analista/Executivo não cadastram.
const CARGOS_SEM_GESTAO_DE_EXECUTIVOS: Cargo[] = ["ANALISTA", "EXECUTIVO"];
// "Dashboard CRM" (ex-"Dashboard (novo)", renomeado 2026-08-18) —
// restrito a ADMIN (pedido do usuário, 2026-08-13); diferente de
// CARGOS_NAO_ADMIN acima, aqui DIRETOR_ANALISTA também fica de fora
// (guard real é no page.tsx — isto só evita mostrar o item).
const CARGOS_SEM_DASHBOARD_CRM: Cargo[] = ["DIRETOR_ANALISTA", "ANALISTA", "GESTOR", "EXECUTIVO"];

// Lista de itens extraída direto do produto real (print de referência,
// onboarding.flysakura.com/admin/onboarding/cadastros) — só "Cadastros"
// tem página construída aqui ainda; os demais aparecem (pra bater com a
// referência) mas ficam desabilitados até cada módulo existir de fato.
const GRUPOS_NAV: AdminNavGrupo[] = [
  {
    label: "Onboarding",
    itens: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Cadastros", href: "/cadastros", icon: ClipboardList },
      {
        label: "Atendimento",
        href: "/atendimento",
        icon: MessageCircle,
        ocultoPara: CARGOS_INTERNOS_APENAS,
      },
      {
        label: "Eventos",
        href: "/cadastros/eventos",
        icon: CalendarDays,
        ocultoPara: CARGOS_INTERNOS_APENAS,
      },
      { label: "Arquivo", href: "/arquivo", icon: Archive, ocultoPara: CARGOS_INTERNOS_APENAS },
    ],
  },
  {
    // Ordem pedida pelo usuário (2026-08-04): Bases -> Gestores ->
    // Executivos -> Associações -> Atribuições — espelha a hierarquia
    // comercial Base -> Gestor -> Executivo.
    label: "Comercial",
    itens: [
      // Reprodução da SPEC do CRM Sakura (SPEC_Dashboard_Sakura.md),
      // dados mock — ver dashboard-vendas.mock-service.ts.
      {
        label: "Dashboard CRM",
        href: "/crm/dashboard",
        icon: BarChart2,
        ocultoPara: CARGOS_SEM_DASHBOARD_CRM,
      },
      {
        label: "Bases",
        href: "/bases",
        icon: MapPin,
        ocultoPara: CARGOS_NAO_ADMIN,
      },
      {
        label: "Gestores",
        href: "/crm/gestores",
        icon: ShieldCheck,
        ocultoPara: CARGOS_NAO_ADMIN,
      },
      {
        label: "Executivos",
        href: "/crm/executivos",
        icon: UserPlus,
        ocultoPara: CARGOS_SEM_GESTAO_DE_EXECUTIVOS,
      },
      {
        label: "Agências",
        href: "/crm/agencias",
        icon: Store,
        ocultoPara: CARGOS_NAO_ADMIN,
      },
      {
        label: "Associações",
        href: "/associacoes",
        icon: Building2,
        ocultoPara: CARGOS_NAO_ADMIN,
      },
      {
        label: "Atribuições",
        href: "/atribuicoes",
        icon: Users,
        ocultoPara: CARGOS_INTERNOS_APENAS,
      },
    ],
  },
  {
    label: "Configurações",
    itens: [
      {
        label: "Usuários",
        href: "/cadastros/usuarios",
        icon: UserCog,
        ocultoPara: CARGOS_INTERNOS_APENAS,
      },
      {
        label: "Messenger",
        href: "/cadastros/messenger",
        icon: Webhook,
        ocultoPara: CARGOS_INTERNOS_APENAS,
      },
      {
        label: "Signatários do Contrato",
        href: "/cadastros/signatarios-padrao",
        icon: FileSignature,
        // Quem assina o contrato pela Sakura é restrito a Admin/Diretor
        // (decisão do usuário, 2026-07-31) — mesmo guard checado de novo
        // nas próprias pages/actions (ver actions.ts do módulo).
        ocultoPara: CARGOS_NAO_ADMIN,
      },
    ],
  },
];

export function AdminSidebar({ cargo }: { cargo: Cargo }) {
  const pathname = usePathname();
  const totalNaoLidas = useAtendimentoNaoLidasStore((state) => state.total);
  const gruposVisiveis = GRUPOS_NAV.map((grupo) => ({
    ...grupo,
    itens: grupo.itens.filter((item) => !item.ocultoPara?.includes(cargo)),
  })).filter((grupo) => grupo.itens.length > 0);

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
        {gruposVisiveis.map((grupo) => (
          <SidebarGroup key={grupo.label}>
            <SidebarGroupLabel>{grupo.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {grupo.itens.map((item) =>
                  item.href ? (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        isActive={
                          // "/cadastros" é prefixo de toda subrota (usuários,
                          // eventos, messenger) — precisa de match exato,
                          // senão o item errado também fica ativo. "Dashboard
                          // CRM" (ex-"Dashboard (novo)") é /crm/dashboard
                          // (renomeado de /crm/dashboard-new em 2026-08-18)
                          // e não colide com "/dashboard", mas o match exato
                          // continua valendo pro item raiz.
                          ROTAS_EXATAS.has(item.href)
                            ? pathname === item.href
                            : pathname.startsWith(item.href)
                        }
                        tooltip={item.label}
                        render={<Link href={item.href} />}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {item.href === "/atendimento" && totalNaoLidas > 0 && (
                        <SidebarMenuBadge className="bg-success text-success-foreground peer-hover/menu-button:text-success-foreground peer-data-active/menu-button:text-success-foreground">
                          {totalNaoLidas}
                        </SidebarMenuBadge>
                      )}
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
