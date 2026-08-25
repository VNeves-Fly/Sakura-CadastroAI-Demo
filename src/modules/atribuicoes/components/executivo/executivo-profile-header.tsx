import type { ReactNode } from "react";
import Link from "next/link";
import { Mail, MapPin, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { ToggleVisibilidadeButton } from "@/modules/shared/components/toggle-visibilidade-button";
import {
  gerarGradienteAvatar,
  extrairIniciais,
} from "@/modules/shared/utils/avatar-gradiente.util";
import type { ExecutivoPerfil } from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface ExecutivoProfileHeaderProps {
  perfil: ExecutivoPerfil;
  // Sobrescreve o stat de "Agências" com dado real do SST (roster, ver
  // executivo-dashboard.sst-service.ts) — só a página de dashboard (que já
  // paga o custo de buscar isso pro crossCanal) passa esse slot;
  // `agencias/`/`agenda/` não passam nada e caem no fallback local-DB
  // abaixo, sem chamada ao SST (ver comentário em
  // executivo-detalhe.adapter.ts).
  statsAgenciasSlot?: ReactNode;
  // "Venderam últimos 30d" saiu do cabeçalho (pedido do usuário,
  // 2026-08-25 — duplicava o card "Vendendo 30d" dos KPIs Secundários
  // logo abaixo, ver kpis-secundarios.tsx). Prop aceita mas ignorada de
  // propósito — as 3 páginas que montam esse slot (dashboard/agencias/
  // agenda) continuam passando, sem precisar tocar nelas.
  statsVendendo30dSlot?: ReactNode;
}

// Cartão de identidade do executivo (SPEC seção 3.2) — avatar com
// gradiente único por id, badges de bases/conquistas e os 2 KPIs de topo
// (agências / gestor responsável). Nome, email, sica, bases e gestorNome
// são reais; `totalAgencias` do `perfil` (local-DB) só aparece quando o
// slot acima não é passado.
export function ExecutivoProfileHeader({ perfil, statsAgenciasSlot }: ExecutivoProfileHeaderProps) {
  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span
            className="flex size-16 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ background: gerarGradienteAvatar(perfil.id) }}
          >
            {extrairIniciais(perfil.nome)}
          </span>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-foreground text-xl font-bold uppercase">{perfil.nome}</h1>
              {perfil.sica ? (
                <Badge variant="outline" className="font-mono">
                  SICA {perfil.sica}
                </Badge>
              ) : null}
            </div>

            <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <Mail className="size-3.5" />
              <span>{perfil.email}</span>
              {perfil.bases.length > 0 ? (
                <>
                  <span aria-hidden>·</span>
                  <MapPin className="size-3.5" />
                  <span>Base {perfil.bases[0]}</span>
                </>
              ) : null}
            </div>

            {perfil.bases.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {perfil.bases.map((base) => (
                  <Badge key={base} variant="outline">
                    {base}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ToggleVisibilidadeButton />
          <Link
            href={`/crm/executivos/${perfil.id}/editar`}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-medium"
          >
            <Pencil className="size-3.5" />
            Editar cadastro
          </Link>
        </div>
      </div>

      <div className="border-border mt-6 grid grid-cols-1 gap-4 border-t pt-5 sm:grid-cols-2">
        <div>
          <p className="text-foreground text-2xl font-bold">
            {statsAgenciasSlot ?? <SensitiveValue value={perfil.totalAgencias} />}
          </p>
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            Agências
          </p>
        </div>
        <div>
          <p className="text-foreground text-lg font-semibold">{perfil.gestorNome ?? "—"}</p>
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            Gestor responsável
          </p>
        </div>
      </div>
    </div>
  );
}
