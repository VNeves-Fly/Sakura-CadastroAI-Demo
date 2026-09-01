// Orquestra a agregação do dashboard do Gestor: chama
// executivoDashboardController pra cada executivo subordinado (sempre mock
// de demonstração, ver executivo-dashboard.controller.ts — repositório de
// DEMO, nunca chama o SST real nem devolve vazio) e soma os resultados com
// agregacoes-gestor.util.ts. Não existe (nem precisa existir) um
// mock-service dedicado a Gestor: a soma do dashboard mock de cada
// executivo subordinado já é o dashboard do Gestor.
import { executivoDashboardController } from "@/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller";
import { mapAgencia } from "@/modules/atribuicoes/adapters/executivo-detalhe.adapter";
import {
  somarCrossCanal,
  somarHeroTodosPeriodos,
  somarKpis,
  somarMargemRentab,
  somarSaudeCarteira,
} from "@/modules/gestores/utils/agregacoes-gestor.util";
import type { ExecutivoComCarteira } from "@/modules/gestores/adapters/gestor-detalhe.adapter";

// `executivoDashboardController` nunca rejeita (sempre mock) — sem try/
// catch aqui: cada item sempre resolve com dado fictício rico, nunca um
// "ausente"/vazio que sumiria da soma ou da tabela da Aba Executivos.
async function obterHeroKpisDoExecutivo(executivo: ExecutivoComCarteira) {
  const agencias = executivo.agencias.map(mapAgencia);
  const { hero, kpis, margemRentab } = await executivoDashboardController.obterHeroKpis(
    executivo.sica,
    executivo.id,
    executivo.agencias.length,
    agencias,
  );
  return { id: executivo.id, hero, kpis, margemRentab };
}

async function obterCrossCanalDoExecutivo(executivo: ExecutivoComCarteira) {
  const agencias = executivo.agencias.map(mapAgencia);
  const resultado = await executivoDashboardController.obterCrossCanalEMiniStats(
    executivo.sica,
    executivo.id,
    executivo.agencias.length,
    agencias,
  );
  return { id: executivo.id, ...resultado };
}

export const gestorDashboardController = {
  async obterHeroKpisAgregado(executivos: ExecutivoComCarteira[]) {
    // Promise.all (não allSettled): cada item já garante sua própria
    // resolução via catch interno acima — porExecutivo SEMPRE tem 1 entrada
    // por executivo de entrada, na mesma ordem, nunca menos.
    const porExecutivo = await Promise.all(executivos.map(obterHeroKpisDoExecutivo));

    const hero = somarHeroTodosPeriodos(porExecutivo.map((p) => p.hero));
    const kpis = somarKpis(
      porExecutivo.map((p) => p.kpis),
      hero.mes.valor,
    );
    const margemRentab = somarMargemRentab(porExecutivo.map((p) => p.margemRentab));
    return { hero, kpis, margemRentab, porExecutivo };
  },

  async obterCrossCanalAgregado(executivos: ExecutivoComCarteira[]) {
    const porExecutivo = await Promise.all(executivos.map(obterCrossCanalDoExecutivo));

    const crossCanal = somarCrossCanal(porExecutivo.map((p) => p.crossCanal));
    const saudeCarteira = somarSaudeCarteira(porExecutivo.map((p) => p.saudeCarteira));
    const agenciasCarteira = porExecutivo.flatMap((p) => p.agenciasCarteira);
    const totalAgencias = porExecutivo.reduce((s, p) => s + p.miniStats.agencias, 0);
    const vendendo30d = porExecutivo.reduce((s, p) => s + p.miniStats.vendendo30d, 0);
    const miniStats = {
      agencias: totalAgencias,
      vendendo30d,
      vendendo30dPct: totalAgencias > 0 ? Math.round((vendendo30d / totalAgencias) * 100) : 0,
      // ociosasLimite/comCredito: nunca reais mesmo no Executivo — soma dos
      // valores mock individuais.
      ociosasLimite: porExecutivo.reduce((s, p) => s + p.miniStats.ociosasLimite, 0),
      comCredito: porExecutivo.reduce((s, p) => s + p.miniStats.comCredito, 0),
    };
    return { crossCanal, saudeCarteira, agenciasCarteira, miniStats, porExecutivo };
  },

  // Helper de conveniência pras abas Executivos/Agências — tabelas
  // renderizam tudo de uma vez, sem ganho de Suspense parcial (diferente do
  // Dashboard).
  async obterAgregadoCompleto(executivos: ExecutivoComCarteira[]) {
    const heroKpis = await gestorDashboardController.obterHeroKpisAgregado(executivos);
    const crossCanal = await gestorDashboardController.obterCrossCanalAgregado(executivos);

    // heroKpis.porExecutivo e crossCanal.porExecutivo têm o MESMO conjunto
    // de ids, na mesma ordem (nenhum dos dois pode perder item — ver
    // funções acima) — mas `{...heroKpis, ...crossCanal}` colidiria na
    // chave `porExecutivo` (o de crossCanal sobrescreveria silenciosamente
    // o de heroKpis, perdendo hero/kpis por executivo). Merge por id:
    const crossCanalPorId = new Map(crossCanal.porExecutivo.map((p) => [p.id, p]));
    const porExecutivo = heroKpis.porExecutivo.map((p) => ({
      ...p, // id, hero, kpis
      ...crossCanalPorId.get(p.id)!, // miniStats, agenciasCarteira, crossCanal, saudeCarteira (sempre existe: mesmos ids)
    }));

    return {
      hero: heroKpis.hero,
      kpis: heroKpis.kpis,
      crossCanal: crossCanal.crossCanal,
      saudeCarteira: crossCanal.saudeCarteira,
      agenciasCarteira: crossCanal.agenciasCarteira,
      miniStats: crossCanal.miniStats,
      porExecutivo, // 1 item por executivo subordinado, sempre, com hero+kpis+miniStats+agenciasCarteira juntos
    };
  },
};
