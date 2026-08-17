"use client";

import { useState } from "react";
import { Mail, MapPin, Circle } from "lucide-react";
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
}

const CHIPS_VISIVEIS_INICIALMENTE = 10;

// Cartão de identidade do gestor — compartilhado entre as abas Dashboard/
// Executivos/Agenda/Agências (SPEC pedida pelo usuário, 2026-08-17). Mesmo
// espírito visual de ExecutivoProfileHeader (avatar com gradiente único por
// id, badges, indicadores de topo), adaptado pros campos próprios de
// Gestor (identificador único, status, lista de bases expansível).
export function GestorProfileHeader({ perfil }: GestorProfileHeaderProps) {
  const [expandido, setExpandido] = useState(false);
  const basesVisiveis = expandido
    ? perfil.bases
    : perfil.bases.slice(0, CHIPS_VISIVEIS_INICIALMENTE);
  const basesRestantes = perfil.bases.length - CHIPS_VISIVEIS_INICIALMENTE;

  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <span
            className="flex size-16 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ background: gerarGradienteAvatar(perfil.id) }}
          >
            {extrairIniciais(perfil.nome)}
          </span>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-foreground text-xl font-bold">{perfil.nome}</h1>
              <Badge variant="outline" className="font-mono">
                #{perfil.identificador}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "gap-1",
                  perfil.ativo
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-muted-foreground/30 bg-muted text-muted-foreground",
                )}
              >
                <Circle className="size-2 fill-current" />
                {perfil.ativo ? "ATIVO" : "INATIVO"}
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
                {basesVisiveis.map((base, indice) => (
                  <Badge key={`${base}-${indice}`} variant="outline">
                    {base}
                  </Badge>
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

        <div className="flex items-center gap-6">
          <Stat value={perfil.totalExecutivos} label="Executivos" />
          <Stat value={perfil.totalAgencias} label="Agências" />
          <Stat
            value={perfil.vendendoUltimos30d}
            label={`Venderam 30D · ${perfil.vendendoUltimos30dPct}%`}
            valueClassName="text-success"
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
  value: number;
  label: string;
  valueClassName?: string;
}) {
  return (
    <div className="text-right">
      <p className={cn("text-2xl font-bold", valueClassName ?? "text-foreground")}>
        <SensitiveValue value={value} />
      </p>
      <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </p>
    </div>
  );
}
