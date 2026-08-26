import { executivoDashboardController } from "@/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller";
import type { Promotor } from "@/modules/atribuicoes/domain/entities/promotor.entity";

export type VendasPorExecutivo = Record<string, { vendasMes: number; vendasAno: number }>;

// "Vendas mês"/"Vendas ano" da lista de Executivos — mesmo fan-out de
// comVendasReais (promotores.routes.ts) e de calcularVendasPorGestor
// (vendas-por-gestor.loader.ts), só que devolvendo 1 entrada por promotor
// em vez de agregar por gestorId. Cada chamada individual nunca rejeita
// (ver executivoDashboardController.obterVendasResumo).
//
// Disparada sem `await` em page.tsx, atrás de Suspense (ver
// promotores-lista-secao.tsx) — mesmo padrão que já existia em
// /crm/gestores desde 2026-08-25, agora replicado aqui pra
// /crm/executivos parar de travar a página inteira em branco enquanto o
// SST responde (ver docs/otimizacao-tempo.md).
export async function calcularVendasPorExecutivos(
  promotores: Promotor[],
): Promise<VendasPorExecutivo> {
  const vendasPorPromotor = await Promise.all(
    promotores.map((promotor) => executivoDashboardController.obterVendasResumo(promotor.sica)),
  );

  const vendasPorExecutivo: VendasPorExecutivo = {};
  promotores.forEach((promotor, indice) => {
    vendasPorExecutivo[promotor.id] = vendasPorPromotor[indice]!;
  });

  return vendasPorExecutivo;
}
