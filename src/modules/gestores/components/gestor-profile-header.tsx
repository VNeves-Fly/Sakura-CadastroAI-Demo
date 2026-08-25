"use client";

import { useState, type ReactNode } from "react";
import { Mail, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import {
  gerarGradienteAvatar,
  extrairIniciais,
} from "@/modules/shared/utils/avatar-gradiente.util";
import { cn } from "@/lib/utils";
import type { GestorPerfil } from "@/modules/gestores/types/gestor-detalhe.types";

interface GestorProfileHeaderProps {
  perfil: GestorPerfil;
  // Sobrescreve o stat de "Agências" com o agregado real (soma dos
  // executivos subordinados via SST, ver gestor-dashboard.controller.ts) —
  // só a página de dashboard (que já paga o custo de buscar isso) passa
  // esse slot; Executivos/Agências não passam nada e caem no fallback mock
  // de `perfil` abaixo, espelhando ExecutivoProfileHeader.
  statsAgenciasSlot?: ReactNode;
  // "Venderam 30D" saiu do cabeçalho (pedido do usuário, 2026-08-25 —
  // duplicava o card "Vendendo 30d" dos KPIs Secundários logo abaixo, ver
  // gestor-kpis-secundarios.tsx). Prop aceita mas ignorada de propósito —
  // a página de Dashboard continua passando, sem precisar tocar nela.
  statsVendendo30dSlot?: ReactNode;
}

const CHIPS_VISIVEIS_INICIALMENTE = 10;

// Cartão de identidade do gestor — compartilhado entre as abas Dashboard/
// Executivos/Agenda/Agências (SPEC pedida pelo usuário, 2026-08-17). Mesmo
// espírito visual de ExecutivoProfileHeader (avatar com gradiente único por
// id, badges, indicadores de topo), adaptado pros campos próprios de
// Gestor (identificador único, status, lista de bases expansível).
export function GestorProfileHeader({ perfil, statsAgenciasSlot }: GestorProfileHeaderProps) {
  const [expandido, setExpandido] = useState(false);
  const basesVisiveis = expandido
    ? perfil.bases
    : perfil.bases.slice(0, CHIPS_VISIVEIS_INICIALMENTE);
  const basesRestantes = perfil.bases.length - CHIPS_VISIVEIS_INICIALMENTE;

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      {/* Linha única centralizada (align-items:center), sem divisória e
          sem grid de métricas — diferente do ExecutivoProfileHeader de
          propósito (SPEC 3.3, checklist §5): o cartão do gestor tem tag
          de base que o do executivo não tem, e não tem os botões de
          visualizar/editar. Pill de status "ATIVO"/"INATIVO" saiu daqui
          (pedido do usuário, 2026-08-25 — mock sem fonte real, nunca
          vamos usar, ver gestor-status.store.ts removida). */}
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span
            className="flex size-[54px] shrink-0 items-center justify-center rounded-full text-[19px] font-bold tracking-wide text-white"
            style={{ background: gerarGradienteAvatar(perfil.id) }}
          >
            {extrairIniciais(perfil.nome)}
          </span>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-foreground text-xl font-extrabold tracking-tight uppercase">
                {perfil.nome}
              </h1>
              <Badge variant="outline" className="font-mono">
                #{perfil.identificador}
              </Badge>
            </div>

            <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              {perfil.email ? (
                <>
                  <Mail className="size-3.5" />
                  <span>{perfil.email}</span>
                </>
              ) : null}
              {perfil.basePrincipal ? (
                <>
                  <span aria-hidden>·</span>
                  <MapPin className="size-3.5" />
                  <span>Base {perfil.basePrincipal}</span>
                </>
              ) : null}
              {perfil.bases.length > 0 ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{perfil.bases.length} bases atendidas</span>
                </>
              ) : null}
            </div>

            {perfil.bases.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Tag rosa (não Badge outline) — mesmo estilo da tag
                    "CWB" da SPEC 3.3, diferente da lista cinza de bases
                    do ExecutivoProfileHeader. */}
                {basesVisiveis.map((base, indice) => (
                  <span
                    key={`${base}-${indice}`}
                    className="border-primary/20 bg-primary/5 text-primary rounded-full border px-3 py-1 text-[11.5px] font-semibold"
                  >
                    {base}
                  </span>
                ))}
                {!expandido && basesRestantes > 0 ? (
                  <button
                    type="button"
                    onClick={() => setExpandido(true)}
                    className="text-primary text-xs font-semibold hover:underline"
                  >
                    +{basesRestantes} bases
                  </button>
                ) : null}
                {expandido && perfil.bases.length > CHIPS_VISIVEIS_INICIALMENTE ? (
                  <button
                    type="button"
                    onClick={() => setExpandido(false)}
                    className="text-muted-foreground text-xs font-semibold hover:underline"
                  >
                    ver menos
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-start gap-8">
          <Stat value={<SensitiveValue value={perfil.totalExecutivos} />} label="Executivos" />
          <Stat
            value={statsAgenciasSlot ?? <SensitiveValue value={perfil.totalAgencias} />}
            label="Agências"
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  valueClassName,
}: {
  value: ReactNode;
  label: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <p className={cn("text-xl font-bold", valueClassName ?? "text-foreground")}>{value}</p>
      <p className="text-muted-foreground text-center text-[10.5px] font-semibold tracking-wide uppercase">
        {label}
      </p>
    </div>
  );
}
