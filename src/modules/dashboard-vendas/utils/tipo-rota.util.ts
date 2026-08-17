import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";

// Filtro Nacional/Internacional/Todos dos cards de ranking (Top Agências,
// Top Fornecedores) — pedido do usuário, 2026-08-17. Sem fonte real de
// tipo_rota por agência/fornecedor hoje: nem /api/agencias/top nem
// /api/reports/ranking-cias trazem essa granularidade (só o endpoint
// agregado /api/consolidado/nacional-vs-internacional, usado só pelo card
// "Nacional vs Internacional", sem breakdown por agência/fornecedor — ver
// dashboard-vendas.sst-service.ts). Split mock determinístico por nome:
// a maioria concentra a maior parte do volume em nacional (55%-94%),
// perfil parecido com o real do setor.
export type TipoRota = "todos" | "nacional" | "internacional";

export const OPCOES_TIPO_ROTA: { valor: TipoRota; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "nacional", label: "Nacional" },
  { valor: "internacional", label: "Internacional" },
];

export interface SplitPorTipoRota {
  nacional: number;
  internacional: number;
}

export function dividirPorTipoRota(chave: string, valorTotal: number): SplitPorTipoRota {
  const seed = hashParaNumero(chave);
  const pctNacional = 55 + (seed % 40);
  const nacional = Math.round(valorTotal * (pctNacional / 100));
  return { nacional, internacional: valorTotal - nacional };
}

export function valorNoTipoRota(
  valorTotal: number,
  split: SplitPorTipoRota,
  tipoRota: TipoRota,
): number {
  return tipoRota === "todos" ? valorTotal : split[tipoRota];
}
