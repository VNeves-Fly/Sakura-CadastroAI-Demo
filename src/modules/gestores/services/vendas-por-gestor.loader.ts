import { executivoDashboardController } from "@/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller";
import type { Promotor } from "@/modules/atribuicoes/domain/entities/promotor.entity";

export type VendasPorGestor = Record<string, { vendasMes: number; vendasAno: number }>;

// "Vendas mês"/"Vendas ano" da lista de Gestores (SPEC seção 2.2) — Gestor
// não existe no SST (sem `sica` próprio), então "real" aqui é a soma das
// vendas reais dos executivos subordinados — mesmo fan-out de
// comVendasReais (promotores.routes.ts), só que agregado por gestorId em
// vez de 1 linha por promotor. Cada chamada individual nunca rejeita (ver
// executivoDashboardController.obterVendasResumo).
//
// Extraído de page.tsx (2026-08-25) pra virar uma promise disparada sem
// `await` — `obterVendasResumo` chama o SST por promotor, em paralelo
// (Promise.all), o mesmo padrão de concorrência alta documentado em
// agencia-carteira.sst-service.ts; com dezenas de promotores isso pode
// levar dezenas de segundos e travava a página inteira em branco até
// resolver. Agora só a seção de vendas (ver gestores-lista-secao.tsx) fica
// atrás de Suspense, igual ao padrão de agencias-crm.
export async function calcularVendasPorGestor(promotores: Promotor[]): Promise<VendasPorGestor> {
  const vendasPorPromotor = await Promise.all(
    promotores.map((promotor) => executivoDashboardController.obterVendasResumo(promotor.sica)),
  );

  const vendasPorGestor: VendasPorGestor = {};
  promotores.forEach((promotor, indice) => {
    const gestorId = promotor.gestorId;
    if (!gestorId) return;
    const vendas = vendasPorPromotor[indice]!;
    const acumulado = vendasPorGestor[gestorId] ?? { vendasMes: 0, vendasAno: 0 };
    vendasPorGestor[gestorId] = {
      vendasMes: acumulado.vendasMes + vendas.vendasMes,
      vendasAno: acumulado.vendasAno + vendas.vendasAno,
    };
  });

  return vendasPorGestor;
}
