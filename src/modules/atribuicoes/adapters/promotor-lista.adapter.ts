import type {
  GestorOpcao,
  PromotorCrudView,
} from "@/modules/atribuicoes/types/promotor-crud.types";
import type { PromotorListaView } from "@/modules/atribuicoes/types/promotor-lista.types";
import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";

// `aprovadas`/`vendendo30d`/`paradas90d`/`limite`/`saudePercentual` NÃO são
// exibidos em nenhuma coluna desta tabela (confirmado em
// executivos-lista-tabela.tsx) — mock determinístico só pra manter o tipo
// preenchido, sem custo de tocar agora (`limite` em particular é bloqueio
// real: não existe "limite de crédito comercial" no SICA). `vendasMes`/
// `vendasAno` deixaram de vir daqui em 2026-08-24 — agora vêm reais de
// `listPromotoresRoute()` (ver comVendasReais em promotores.routes.ts).
function gerarMetricasMock(id: string) {
  const base = hashParaNumero(id);

  const aprovadas = 5 + (base % 60);
  const paradas90d = Math.max(0, Math.round(aprovadas * (((base >> 5) % 30) / 100)));
  const vendendo30d = Math.max(1, Math.round(aprovadas * (0.3 + ((base >> 3) % 50) / 100)));
  const vendasAnoMock = ((base % 900) + 50) * 10_000; // só pra derivar `limite`, nunca exibido
  const limite = Math.round(vendasAnoMock * (1.2 + ((base >> 4) % 20) / 100));
  const saudePercentual = 20 + (base % 70);

  return { aprovadas, vendendo30d, paradas90d, limite, saudePercentual };
}

export const promotorListaAdapter = {
  toListaView(
    promotor: PromotorCrudView,
    gestoresPorId: Map<string, GestorOpcao>,
  ): PromotorListaView {
    const metricas = gerarMetricasMock(promotor.id);
    const vendasMes = promotor.vendasMes ?? 0;
    const vendasAno = promotor.vendasAno ?? 0;

    return {
      id: promotor.id,
      nome: promotor.nome,
      gestorNome: promotor.gestorId ? (gestoresPorId.get(promotor.gestorId)?.nome ?? null) : null,
      bases: promotor.bases,
      temAcesso: promotor.temAcesso,
      semVinculo: promotor.bases.length === 0 || !promotor.gestorId,
      semVenda: vendasAno === 0,
      vendasMes,
      vendasAno,
      ...metricas,
    };
  },

  toListaViewList(
    promotores: PromotorCrudView[],
    gestoresOptions: GestorOpcao[] | null,
  ): PromotorListaView[] {
    const gestoresPorId = new Map((gestoresOptions ?? []).map((gestor) => [gestor.id, gestor]));
    return promotores.map((promotor) => promotorListaAdapter.toListaView(promotor, gestoresPorId));
  },
};
