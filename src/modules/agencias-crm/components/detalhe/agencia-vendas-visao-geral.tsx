"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Percent,
  Plane,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import {
  COR_AEREO_INTERNACIONAL,
  COR_AEREO_NACIONAL,
  COR_TERRESTRE,
} from "@/modules/agencias-crm/constants/agencia-dashboard.constants";
import {
  formatarData,
  formatarMoedaAbreviada,
} from "@/modules/agencias-crm/utils/formatar-moeda.util";
import type { AgenciaDetalheVendas } from "@/modules/agencias-crm/types/agencia-detalhe.types";

interface AgenciaVendasVisaoGeralProps {
  vendas: AgenciaDetalheVendas;
}

function KpiCard({
  label,
  valor,
  sublinha,
}: {
  label: string;
  valor: React.ReactNode;
  sublinha?: React.ReactNode;
}) {
  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </p>
      <p className="text-foreground mt-1 text-lg font-bold tabular-nums">{valor}</p>
      {sublinha ? <p className="text-muted-foreground mt-0.5 text-xs">{sublinha}</p> : null}
    </div>
  );
}

function TooltipMes({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const nomes: Record<string, string> = {
    nacional: "Aéreo Nacional",
    internacional: "Aéreo Internacional",
    terrestre: "Terrestre",
  };
  return (
    <div className="border-border bg-popover rounded-lg border p-3 text-xs shadow-md">
      <p className="text-foreground mb-1.5 font-semibold">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: item.color }} />
            {nomes[item.dataKey] ?? item.dataKey}
          </span>
          <span className="text-foreground font-medium">
            <SensitiveValue value={formatarMoedaAbreviada(item.value)} />
          </span>
        </p>
      ))}
    </div>
  );
}

// Sub-aba "Visão Geral" de Vendas (SPEC seção 4.4) — todo o bloco de
// vendas é mock determinístico (ver agencia-detalhe.adapter.ts), não
// existe reserva/bilhete/limite de crédito real modelado no domínio hoje.
export function AgenciaVendasVisaoGeral({ vendas }: AgenciaVendasVisaoGeralProps) {
  const variacaoPositiva = vendas.variacaoMesAnterior.pct >= 0;
  const semRiscoAlto = vendas.riscoEmissao.alto30d === 0 && vendas.riscoEmissao.alto90d === 0;
  const mixSemVenda =
    vendas.mixAereoTerrestre.aereoPct === 0 && vendas.mixAereoTerrestre.terrestrePct === 0;

  const dadosMix = [
    { nome: "Aéreo", valor: vendas.mixAereoTerrestre.aereoPct, cor: COR_AEREO_NACIONAL },
    { nome: "Terrestre", valor: vendas.mixAereoTerrestre.terrestrePct, cor: COR_TERRESTRE },
  ].filter((fatia) => fatia.valor > 0);

  const totalComparativo = vendas.resumoComparativo.reduce(
    (acc, linha) => ({
      volume: acc.volume + linha.volume,
      mediaMensal: acc.mediaMensal + linha.mediaMensal,
      itens: acc.itens + linha.itens,
    }),
    { volume: 0, mediaMensal: 0, itens: 0 },
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="border-border bg-card rounded-2xl border p-5">
        <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle
            className={semRiscoAlto ? "text-muted-foreground size-4" : "text-destructive size-4"}
          />
          Risco de Emissões (90 dias)
        </h3>

        {semRiscoAlto ? (
          <p className="text-muted-foreground mt-2 text-sm">
            Nenhuma venda com sinal de risco nos últimos 90 dias.
          </p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard label="Alto risco (30d)" valor={vendas.riscoEmissao.alto30d} />
              <KpiCard label="Alto risco (90d)" valor={vendas.riscoEmissao.alto90d} />
              <KpiCard label="Médio risco (90d)" valor={vendas.riscoEmissao.medio90d} />
              <KpiCard
                label="Valor em risco alto"
                valor={
                  <SensitiveValue
                    value={formatarMoedaAbreviada(vendas.riscoEmissao.valorEmRiscoAlto)}
                  />
                }
              />
            </div>
            <p className="text-muted-foreground mt-3 text-xs">
              Score médio (90d): {vendas.riscoEmissao.scoreMedio90d}
              {vendas.riscoEmissao.ultimaVendaRiscoAlto
                ? ` · Última venda de alto risco em ${formatarData(vendas.riscoEmissao.ultimaVendaRiscoAlto)}`
                : ""}
            </p>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Aéreo Nacional"
          valor={<SensitiveValue value={formatarMoedaAbreviada(vendas.aereoNacional.volume)} />}
          sublinha={`${vendas.aereoNacional.bilhetes} bilhetes · ${vendas.aereoNacional.pctAereo}% do aéreo`}
        />
        <KpiCard
          label="Aéreo Internacional"
          valor={
            <SensitiveValue value={formatarMoedaAbreviada(vendas.aereoInternacional.volume)} />
          }
          sublinha={`${vendas.aereoInternacional.bilhetes} bilhetes · ${vendas.aereoInternacional.pctAereo}% do aéreo`}
        />
        <KpiCard
          label="Terrestre"
          valor={<SensitiveValue value={formatarMoedaAbreviada(vendas.terrestre.volume)} />}
          sublinha={`${vendas.terrestre.servicos} serviços · ${vendas.terrestre.pctMix}% do mix`}
        />
        <KpiCard
          label="Volume Total"
          valor={<SensitiveValue value={formatarMoedaAbreviada(vendas.volumeTotalAno)} />}
          sublinha="ano"
        />

        <KpiCard
          label="Média de Vendas/Dia"
          valor={<SensitiveValue value={formatarMoedaAbreviada(vendas.mediaVendasDia.valor)} />}
          sublinha={`${vendas.mediaVendasDia.bilhetesDia} bilh./dia · ${vendas.mediaVendasDia.dias}d`}
        />
        <KpiCard
          label="Reservas (Aéreo)"
          valor={vendas.reservasAereo.total}
          sublinha={`${vendas.reservasAereo.nacional} nac. · ${vendas.reservasAereo.internacional} int.`}
        />
        <KpiCard
          label="Ticket Médio Aéreo"
          valor={<SensitiveValue value={formatarMoedaAbreviada(vendas.ticketMedioAereo)} />}
          sublinha="tarifa + adicional"
        />
        <KpiCard
          label="Variação Mês Anterior"
          valor={
            <span
              className={
                variacaoPositiva
                  ? "flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                  : "text-destructive flex items-center gap-1"
              }
            >
              {variacaoPositiva ? (
                <ArrowUpRight className="size-4" />
              ) : (
                <ArrowDownRight className="size-4" />
              )}
              {Math.abs(vendas.variacaoMesAnterior.pct).toFixed(1)}%
            </span>
          }
          sublinha={
            <>
              <SensitiveValue value={formatarMoedaAbreviada(vendas.variacaoMesAnterior.valor)} />{" "}
              último mês
            </>
          }
        />
      </div>

      <div className="border-border bg-card rounded-2xl border p-5">
        <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
          <TrendingUp className="text-primary size-4" />
          Evolução Mensal — Nacional × Internacional × Terrestre
        </h3>
        <p className="text-muted-foreground text-xs">Valores consolidados por mês</p>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={vendas.evolucaoMensal} margin={{ left: -16 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(valor: number) => formatarMoedaAbreviada(valor)}
                width={64}
              />
              <Tooltip content={<TooltipMes />} cursor={{ stroke: "hsl(var(--border))" }} />
              <Line
                type="monotone"
                dataKey="nacional"
                stroke={COR_AEREO_NACIONAL}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="internacional"
                stroke={COR_AEREO_INTERNACIONAL}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="terrestre"
                stroke={COR_TERRESTRE}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-5 text-xs">
          <LegendaItem cor={COR_AEREO_NACIONAL} label="Nacional" />
          <LegendaItem cor={COR_AEREO_INTERNACIONAL} label="Internacional" />
          <LegendaItem cor={COR_TERRESTRE} label="Terrestre" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
            <Trophy className="text-warning size-4" />
            Top 10 Rotas mais vendidas
          </h3>
          <p className="text-muted-foreground text-xs">por nº de bilhetes (amostra recente)</p>
          {vendas.topRotas.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">Sem dados de rota.</p>
          ) : (
            <ol className="divide-border mt-3 flex max-h-72 flex-col divide-y overflow-y-auto">
              {vendas.topRotas.map((rota, indice) => (
                <li
                  key={rota.rota}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className="text-foreground flex min-w-0 items-center gap-2 truncate">
                    <span className="text-muted-foreground tabular-nums">{indice + 1}º</span>
                    {rota.rota}
                    {rota.internacional ? (
                      <span className="border-border text-muted-foreground shrink-0 rounded-full border px-1.5 py-0.5 text-[10px]">
                        Internacional
                      </span>
                    ) : null}
                  </span>
                  <span className="text-foreground shrink-0 text-right text-xs tabular-nums">
                    {rota.bilhetes} bilhetes
                    <br />
                    <SensitiveValue value={formatarMoedaAbreviada(rota.volume)} />
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
            <Plane className="text-primary size-4" />
            Top Companhias Aéreas
          </h3>
          <p className="text-muted-foreground text-xs">por volume faturado</p>
          {vendas.topCompanhias.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Sem dados de companhias.
            </p>
          ) : (
            <ol className="divide-border mt-3 flex max-h-72 flex-col divide-y overflow-y-auto">
              {vendas.topCompanhias.map((cia, indice) => (
                <li key={cia.nome} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-foreground truncate">
                    <span className="text-muted-foreground mr-2 tabular-nums">{indice + 1}º</span>
                    {cia.nome}
                  </span>
                  <span className="text-foreground shrink-0 font-medium tabular-nums">
                    <SensitiveValue value={formatarMoedaAbreviada(cia.volume)} />
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
            <Percent className="text-primary size-4" />
            Mix Aéreo × Terrestre
          </h3>
          <p className="text-muted-foreground text-xs">ano</p>

          {mixSemVenda ? (
            <p className="text-muted-foreground py-8 text-center text-sm">Sem vendas no período.</p>
          ) : (
            <>
              <div className="mt-2 h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosMix}
                      dataKey="valor"
                      nameKey="nome"
                      innerRadius="65%"
                      outerRadius="100%"
                      paddingAngle={dadosMix.length > 1 ? 2 : 0}
                      stroke="none"
                    >
                      {dadosMix.map((fatia) => (
                        <Cell key={fatia.nome} fill={fatia.cor} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(valor, nome) => [`${valor}%`, nome]}
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-5 text-xs">
                {dadosMix.map((fatia) => (
                  <LegendaItem
                    key={fatia.nome}
                    cor={fatia.cor}
                    label={`${fatia.nome} (${fatia.valor}%)`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="border-border bg-card overflow-x-auto rounded-2xl border p-5">
          <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="text-primary size-4" />
            Resumo Comparativo
          </h3>
          <p className="text-muted-foreground text-xs">Breakdown por modalidade — ano</p>
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="text-muted-foreground border-border border-b text-[11px] font-semibold tracking-wide uppercase">
                <th className="pr-3 pb-2">Modalidade</th>
                <th className="pr-3 pb-2">Volume</th>
                <th className="pr-3 pb-2">% Mix</th>
                <th className="pr-3 pb-2">Média Mensal</th>
                <th className="pb-2">Itens</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {vendas.resumoComparativo.map((linha) => (
                <tr key={linha.modalidade}>
                  <td className="text-foreground py-2 pr-3 font-medium">{linha.modalidade}</td>
                  <td className="text-foreground py-2 pr-3 tabular-nums">
                    <SensitiveValue value={formatarMoedaAbreviada(linha.volume)} />
                  </td>
                  <td className="text-foreground py-2 pr-3 tabular-nums">{linha.pctMix}%</td>
                  <td className="text-foreground py-2 pr-3 tabular-nums">
                    <SensitiveValue value={formatarMoedaAbreviada(linha.mediaMensal)} />
                  </td>
                  <td className="text-foreground py-2 tabular-nums">{linha.itens}</td>
                </tr>
              ))}
              <tr className="border-border border-t font-semibold">
                <td className="text-foreground py-2 pr-3">Total</td>
                <td className="text-foreground py-2 pr-3 tabular-nums">
                  <SensitiveValue value={formatarMoedaAbreviada(totalComparativo.volume)} />
                </td>
                <td className="text-foreground py-2 pr-3 tabular-nums">100%</td>
                <td className="text-foreground py-2 pr-3 tabular-nums">
                  <SensitiveValue value={formatarMoedaAbreviada(totalComparativo.mediaMensal)} />
                </td>
                <td className="text-foreground py-2 tabular-nums">{totalComparativo.itens}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LegendaItem({ cor, label }: { cor: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ background: cor }} />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
