"use client";

import type { ReactNode } from "react";
import { Landmark, ShieldCheck, UserCog, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  formatarData,
  formatarMoedaAbreviada,
  formatarPercentual,
} from "@/modules/agencias-crm/utils/formatar-moeda.util";
import type { AgenciaDetalhePerfilComercial } from "@/modules/agencias-crm/types/agencia-detalhe.types";

interface AgenciaPerfilComercialTabProps {
  perfil: AgenciaDetalhePerfilComercial;
}

function Secao({
  icon: Icon,
  titulo,
  children,
}: {
  icon: typeof Landmark;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <div className="border-border border-b pb-5 last:border-0">
      <h3 className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="text-primary size-4" />
        {titulo}
      </h3>
      {children}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </span>
      <div className="text-foreground text-sm">{children}</div>
    </div>
  );
}

// Aba "Perfil Comercial" (SPEC seção 4.4) — sica/base/gestor/executivo/
// limite faturado/cartão/bloqueio de crédito são reais (SST,
// `base-empresa-cadastro`, ver agencia-detalhe.adapter.ts). Segmento,
// média de faturamento, comissão e incentivo não têm fonte real em
// nenhum sistema hoje — sem mock, sempre "—" (pedido do usuário,
// 2026-08-21).
export function AgenciaPerfilComercialTab({ perfil }: AgenciaPerfilComercialTabProps) {
  return (
    <div className="flex flex-col gap-5">
      <Secao icon={UserCog} titulo="Atribuição">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Campo label="SICA">{perfil.sica ?? "—"}</Campo>
          <Campo label="Base">{perfil.base ?? "—"}</Campo>
          <Campo label="Segmento">
            {perfil.segmento ? <Badge variant="outline">{perfil.segmento}</Badge> : "—"}
          </Campo>

          <Campo label="Gestor">{perfil.gestorNome ?? "—"}</Campo>
          <Campo label="Executivo">{perfil.executivoNome ?? "—"}</Campo>
          <Campo label="Média de Faturamento">
            {perfil.mediaFaturamento !== null
              ? formatarMoedaAbreviada(perfil.mediaFaturamento)
              : "—"}
          </Campo>
        </div>
      </Secao>

      <Secao icon={Wallet} titulo="Limites & Comissão">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Campo label="Limite Faturado">{formatarMoedaAbreviada(perfil.limiteFaturado)}</Campo>
          <Campo label="Limite Cartão">{formatarMoedaAbreviada(perfil.limiteCartao)}</Campo>
          <Campo label="Bloqueio de Crédito">
            {perfil.bloqCred ? (
              <Badge variant="destructive">Bloqueado</Badge>
            ) : (
              <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400">
                Liberado
              </Badge>
            )}
          </Campo>

          <Campo label="Comissão">
            {perfil.comissaoPct !== null ? formatarPercentual(perfil.comissaoPct) : "—"}
          </Campo>
          <Campo label="Incentivo">
            {perfil.incentivoPct !== null && perfil.incentivoPct > 0
              ? formatarPercentual(perfil.incentivoPct)
              : "—"}
          </Campo>
          <Campo label="Data Última Compra">
            {perfil.dataUltimaCompra ? formatarData(perfil.dataUltimaCompra) : "—"}
          </Campo>
        </div>
      </Secao>

      <Secao icon={Landmark} titulo="Dados Bancários">
        {perfil.bancoNome || perfil.bancoCodigo || perfil.bancoAgencia || perfil.bancoConta ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Campo label="Banco">{perfil.bancoNome ?? "—"}</Campo>
            <Campo label="Código">{perfil.bancoCodigo ?? "—"}</Campo>
            <Campo label="Agência">{perfil.bancoAgencia ?? "—"}</Campo>
            <Campo label="Conta">{perfil.bancoConta ?? "—"}</Campo>
          </div>
        ) : (
          <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <ShieldCheck className="size-3.5 shrink-0" />
            Dados bancários não informados no cadastro.
          </p>
        )}
      </Secao>
    </div>
  );
}
