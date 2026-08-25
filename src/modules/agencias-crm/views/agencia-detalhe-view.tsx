"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, FileText, LayoutDashboard, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AgenciaDashboardTab } from "@/modules/agencias-crm/components/detalhe/agencia-dashboard-tab";
import { AgenciaDadosDocumentacaoTab } from "@/modules/agencias-crm/components/detalhe/agencia-dados-documentacao-tab";
import { AgenciaPerfilComercialTab } from "@/modules/agencias-crm/components/detalhe/agencia-perfil-comercial-tab";
import { AgenciaVendasFaturas } from "@/modules/agencias-crm/components/detalhe/agencia-vendas-faturas";
import type { AgenciaDetalheView } from "@/modules/agencias-crm/types/agencia-detalhe.types";

interface AgenciaDetalheViewProps {
  detalhe: AgenciaDetalheView;
}

type AbaDetalhe = "dashboard" | "dados" | "faturas";

const ABAS: { chave: AbaDetalhe; label: string; icon: typeof LayoutDashboard }[] = [
  { chave: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { chave: "dados", label: "Dados & Documentação", icon: Building2 },
  { chave: "faturas", label: "Faturas", icon: FileText },
];

function formatarDataHora(dataIso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(
    new Date(dataIso),
  );
}

// Página de detalhe da Agência (SPEC_AGENCIAS_SAKURA seção 3) — substitui
// o antigo AgenciaDetalheModal por uma rota própria em
// /crm/agencias/[id], mesmo padrão de /crm/executivos/[id] e
// /crm/gestores/[id] (pedido do usuário, 2026-08-21). 3 abas fixas
// (Dashboard/Dados & Documentação/Faturas); "Perfil Comercial" continua
// sem aba própria, redistribuído dentro de "Dados & Documentação" (mesma
// decisão de 2026-08-19, mantida aqui). Sem switch "Ativo Sistema" nem
// "Excluir agência" — a SPEC nova não prevê nenhum dos dois no cabeçalho
// (o switch antigo era só mock local, não persistia nada de verdade).
export function AgenciaDetalheView({ detalhe }: AgenciaDetalheViewProps) {
  const [aba, setAba] = useState<AbaDetalhe>("dashboard");
  const [socioSelecionadoId, setSocioSelecionadoId] = useState<string | null>(
    detalhe.dadosDocumentacao.socios[0]?.id ?? null,
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <Link
        href="/crm/agencias"
        className="border-input bg-card text-foreground hover:bg-accent inline-flex h-[34px] w-fit items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition active:scale-97"
      >
        <ArrowLeft className="size-3.5" />
        Voltar para Agências Sakura
      </Link>

      <div className="border-border bg-card w-full rounded-2xl border shadow-[0_1px_2px_rgba(20,20,50,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5 pb-0">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-foreground text-[21px] font-bold tracking-tight">
                {detalhe.dadosDocumentacao.empresa.nomeFantasia ??
                  detalhe.dadosDocumentacao.empresa.razaoSocial}
              </h1>
              <Badge variant="outline" className="font-mono">
                {detalhe.identificador}
              </Badge>
            </div>
            <p className="text-[13.5px] text-[#4A4A66]">
              {detalhe.dadosDocumentacao.empresa.razaoSocial} ·{" "}
              {detalhe.dadosDocumentacao.empresa.cnpj}
            </p>
            <p className="text-[12.5px] text-[#8888AA]">
              Executivo: {detalhe.perfilComercial.executivoNome ?? "—"} · Gestor:{" "}
              {detalhe.perfilComercial.gestorNome ?? "—"} · Base:{" "}
              {detalhe.perfilComercial.base ?? "—"}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <Link
              href="/crm/agencias"
              className="border-primary/35 hover:bg-primary/5 flex size-[30px] items-center justify-center rounded-lg border transition active:scale-94"
              aria-label="Fechar"
            >
              <X className="text-primary size-4" />
            </Link>
            {detalhe.ativadoEm ? (
              <p className="text-[12px] text-[#8888AA]">
                Ativado em {formatarDataHora(detalhe.ativadoEm)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="border-border flex gap-2 border-b px-5 pt-4">
          {ABAS.map((item) => {
            const ativa = item.chave === aba;
            return (
              <button
                key={item.chave}
                type="button"
                onClick={() => setAba(item.chave)}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-1 py-2.5 text-[13.5px] font-semibold transition",
                  ativa
                    ? "border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground border-transparent",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {aba === "dashboard" ? (
            <AgenciaDashboardTab agenciaId={detalhe.id} vendas={detalhe.vendas} />
          ) : null}
          {aba === "dados" ? (
            <div className="flex flex-col gap-6">
              <AgenciaDadosDocumentacaoTab
                dados={detalhe.dadosDocumentacao}
                socioSelecionadoId={socioSelecionadoId}
                onSelecionarSocio={setSocioSelecionadoId}
              />
              <AgenciaPerfilComercialTab perfil={detalhe.perfilComercial} />
            </div>
          ) : null}
          {aba === "faturas" ? (
            <AgenciaVendasFaturas
              faturas={detalhe.vendas.faturas}
              identificadorAgencia={detalhe.identificador}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
