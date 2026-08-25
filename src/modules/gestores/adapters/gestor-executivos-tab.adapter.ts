import { limiteMock } from "@/modules/atribuicoes/adapters/executivo-agencias.adapter";
import type { ExecutivoComCarteira } from "@/modules/gestores/adapters/gestor-detalhe.adapter";
import type { gestorDashboardController } from "@/modules/gestores/presentation/controllers/gestor-dashboard.controller";
import type { ExecutivoDaGestaoView } from "@/modules/gestores/types/gestor-executivos-tab.types";

type PorExecutivo = Awaited<
  ReturnType<typeof gestorDashboardController.obterAgregadoCompleto>
>["porExecutivo"][number];

const FAIXAS_PARADA = new Set(["90a365d", "semVenda365d"]);

export const gestorExecutivosTabAdapter = {
  // `agregado` vem de gestorDashboardController.obterAgregadoCompleto(...) —
  // sempre 1 item por executivo, na mesma ordem/id de `executivo`, mesmo se
  // o SST falhar pra algum (ver gestor-dashboard.controller.ts).
  toView(executivo: ExecutivoComCarteira, agregado: PorExecutivo): ExecutivoDaGestaoView {
    const aprovadas = executivo.agencias.length;
    const paradas90d = agregado.agenciasCarteira.filter((agencia) =>
      FAIXAS_PARADA.has(agencia.faixaRecencia),
    ).length;
    const limite = agregado.agenciasCarteira.reduce(
      (total, agencia) => total + limiteMock(agencia.codigo),
      0,
    );

    return {
      id: executivo.id,
      nome: executivo.nome,
      email: executivo.email,
      sica: executivo.sica,
      bases: executivo.bases,
      aprovadas,
      semVendaAno: agregado.hero.ano.valor === 0,
      vendendo30d: agregado.miniStats.vendendo30d,
      paradas90d,
      vendasMes: agregado.hero.mes.valor,
      vendasAno: agregado.hero.ano.valor,
      limite,
      saudePercentual: agregado.miniStats.vendendo30dPct,
    };
  },

  toViewList(
    executivos: ExecutivoComCarteira[],
    porExecutivo: PorExecutivo[],
  ): ExecutivoDaGestaoView[] {
    const agregadoPorId = new Map(porExecutivo.map((item) => [item.id, item]));
    return executivos.map((executivo) => {
      const agregado = agregadoPorId.get(executivo.id);
      if (!agregado) {
        throw new Error(`Agregado ausente para o executivo ${executivo.id}`);
      }
      return gestorExecutivosTabAdapter.toView(executivo, agregado);
    });
  },
};
