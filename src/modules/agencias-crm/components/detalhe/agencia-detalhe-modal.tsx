"use client";

import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Clock,
  DollarSign,
  FileText,
  Globe2,
  Plane,
  Trash2,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatarData } from "@/modules/agencias-crm/utils/formatar-moeda.util";
import { cn } from "@/lib/utils";
import { useAgenciaDetalheViewModel } from "@/modules/agencias-crm/view-models/use-agencia-detalhe.view-model";
import { AgenciaDadosDocumentacaoTab } from "@/modules/agencias-crm/components/detalhe/agencia-dados-documentacao-tab";
import { AgenciaPerfilComercialTab } from "@/modules/agencias-crm/components/detalhe/agencia-perfil-comercial-tab";
import { AgenciaVendasTab } from "@/modules/agencias-crm/components/detalhe/agencia-vendas-tab";
import type { AbaDetalhe } from "@/modules/agencias-crm/view-models/use-agencia-detalhe.view-model";
import type { AgenciaDetalheAntecedencia } from "@/modules/agencias-crm/types/agencia-detalhe.types";

interface AgenciaDetalheModalProps {
  agenciaId: string | null;
  onOpenChange: (open: boolean) => void;
}

const ABAS: { chave: AbaDetalhe; label: string; icon: typeof Building2 }[] = [
  { chave: "dados", label: "Dados & Documentação", icon: Building2 },
  { chave: "comercial", label: "Perfil Comercial", icon: DollarSign },
  { chave: "vendas", label: "Vendas", icon: FileText },
];

function formatarDataHora(dataIso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(
    new Date(dataIso),
  );
}

function KpiTopo({
  icon: Icon,
  label,
  valor,
  valorClassName,
  sublinha,
}: {
  icon: typeof Plane;
  label: string;
  valor: string;
  valorClassName?: string;
  sublinha: string;
}) {
  return (
    <div className="border-border bg-card rounded-xl border p-3.5">
      <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className={cn("mt-1 text-lg font-bold tabular-nums", valorClassName ?? "text-foreground")}>
        {valor}
      </p>
      <p className="text-muted-foreground mt-0.5 text-xs">{sublinha}</p>
    </div>
  );
}

function labelAntecedencia(antecedencia: AgenciaDetalheAntecedencia): string {
  return `${antecedencia.bilhetes.toLocaleString("pt-BR")} bilhetes · ${antecedencia.mesesBase} meses`;
}

// Modal de Detalhe da Agência (SPEC_AGENCIAS_SAKURA.md, seção 4) — shell
// com cabeçalho de identidade, faixa de KPIs e 3 abas reais (Dados &
// Documentação/Perfil Comercial/Vendas), substituindo o placeholder
// provisório que redirecionava pro dossiê de /cadastros/:id. "Excluir
// agência" é renderizado por fidelidade à SPEC mas fica desabilitado com
// tooltip — não existe use-case real de exclusão de agência no domínio
// hoje, e não vamos fingir uma ação destrutiva que não faz nada de verdade.
export function AgenciaDetalheModal({ agenciaId, onOpenChange }: AgenciaDetalheModalProps) {
  const vm = useAgenciaDetalheViewModel(agenciaId);

  return (
    <Dialog open={agenciaId !== null} onOpenChange={onOpenChange}>
      {/* Altura fixa (não só max-h) — sem isso o modal encolhia junto com
          o conteúdo ao trocar pra abas mais curtas (ex.: Perfil Comercial),
          dando a sensação de "pulo" de tamanho ao trocar de aba. */}
      <DialogContent className="h-[85vh] max-h-[85vh] w-[calc(100%-2rem)] max-w-5xl">
        {vm.isLoading ? (
          <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
            Carregando agência...
          </div>
        ) : null}

        {vm.error ? (
          <div className="text-destructive flex h-64 items-center justify-center text-sm">
            {vm.error}
          </div>
        ) : null}

        {vm.detalhe ? (
          <>
            <div className="border-border flex flex-col gap-4 border-b p-5 pr-14">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-foreground text-lg font-bold">
                      {vm.detalhe.dadosDocumentacao.empresa.nomeFantasia ??
                        vm.detalhe.dadosDocumentacao.empresa.razaoSocial}
                    </h2>
                    <Badge variant="outline" className="font-mono">
                      {vm.detalhe.identificador}
                    </Badge>
                    {vm.detalhe.categoria ? (
                      <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                        🏆 {vm.detalhe.categoria}
                      </span>
                    ) : null}
                    {vm.detalhe.temRiscoCadastral ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="size-3" />
                        Risco cadastral
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {vm.detalhe.dadosDocumentacao.empresa.razaoSocial} ·{" "}
                    {vm.detalhe.dadosDocumentacao.empresa.cnpj}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Promotor: {vm.detalhe.perfilComercial.executivoNome ?? "—"} · Gestor:{" "}
                    {vm.detalhe.perfilComercial.gestorNome ?? "—"} · Base:{" "}
                    {vm.detalhe.perfilComercial.base ?? "—"}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <label className="flex items-center gap-2 text-xs font-medium">
                    <span className={vm.ativoLocal ? "text-foreground" : "text-muted-foreground"}>
                      {vm.ativoLocal ? "Ativo Sistema" : "Inativo"}
                    </span>
                    <Switch checked={vm.ativoLocal} onCheckedChange={vm.alternarAtivoLocal} />
                  </label>
                  {vm.detalhe.ativadoEm ? (
                    <p className="text-muted-foreground text-[11px]">
                      Ativado em {formatarDataHora(vm.detalhe.ativadoEm)}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiTopo
                  icon={Plane}
                  label="Antecedência Nacional"
                  valor={`${vm.detalhe.kpisTopo.antecedenciaNacional.dias.toFixed(1).replace(".", ",")} dias`}
                  sublinha={labelAntecedencia(vm.detalhe.kpisTopo.antecedenciaNacional)}
                />
                <KpiTopo
                  icon={Globe2}
                  label="Antecedência Internacional"
                  valor={`${vm.detalhe.kpisTopo.antecedenciaInternacional.dias.toFixed(1).replace(".", ",")} dias`}
                  sublinha={labelAntecedencia(vm.detalhe.kpisTopo.antecedenciaInternacional)}
                />
                <KpiTopo
                  icon={CalendarClock}
                  label="Sem Comprar"
                  valor={`${vm.detalhe.kpisTopo.diasSemComprar} dias`}
                  valorClassName={
                    vm.detalhe.kpisTopo.diasSemComprar > 90 ? "text-destructive" : "text-warning"
                  }
                  sublinha={
                    vm.detalhe.kpisTopo.dataUltimaCompra
                      ? `última compra ${formatarData(vm.detalhe.kpisTopo.dataUltimaCompra)}`
                      : "sem compras registradas"
                  }
                />
                <KpiTopo
                  icon={Clock}
                  label="Cliente Sakura há"
                  valor={vm.detalhe.dadosDocumentacao.datas.tempoComoCliente}
                  sublinha={
                    vm.detalhe.ativadoEm ? `desde ${formatarData(vm.detalhe.ativadoEm)}` : "—"
                  }
                />
              </div>

              <div className="flex items-center justify-end">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        aria-disabled="true"
                        onClick={(evento) => evento.preventDefault()}
                        className="text-destructive flex cursor-not-allowed items-center gap-1.5 text-xs font-medium opacity-60"
                      />
                    }
                  >
                    <Trash2 className="size-3.5" />
                    Excluir agência
                  </TooltipTrigger>
                  <TooltipContent>Exclusão de agência ainda não disponível.</TooltipContent>
                </Tooltip>
              </div>

              <div className="flex gap-1">
                {ABAS.map((aba) => {
                  const ativa = aba.chave === vm.aba;
                  return (
                    <button
                      key={aba.chave}
                      type="button"
                      onClick={() => vm.setAba(aba.chave)}
                      className={cn(
                        "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition",
                        ativa
                          ? "border-primary text-primary"
                          : "text-muted-foreground hover:text-foreground border-transparent",
                      )}
                    >
                      <aba.icon className="size-4" />
                      {aba.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {vm.aba === "dados" ? (
                <AgenciaDadosDocumentacaoTab
                  dados={vm.detalhe.dadosDocumentacao}
                  socioSelecionadoId={vm.socioSelecionadoId}
                  onSelecionarSocio={vm.setSocioSelecionadoId}
                />
              ) : null}
              {vm.aba === "comercial" ? (
                <AgenciaPerfilComercialTab perfil={vm.detalhe.perfilComercial} />
              ) : null}
              {vm.aba === "vendas" ? (
                <AgenciaVendasTab
                  vendas={vm.detalhe.vendas}
                  identificadorAgencia={vm.detalhe.identificador}
                  subAba={vm.subAbaVendas}
                  onMudarSubAba={vm.setSubAbaVendas}
                />
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
