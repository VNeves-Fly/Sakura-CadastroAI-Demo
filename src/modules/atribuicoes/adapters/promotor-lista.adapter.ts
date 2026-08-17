import type {
  GestorOpcao,
  PromotorCrudView,
} from "@/modules/atribuicoes/types/promotor-crud.types";
import type { PromotorListaView } from "@/modules/atribuicoes/types/promotor-lista.types";
import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";

// Métricas de carteira SEM fonte real hoje (ver comentário em
// promotor-lista.types.ts) — mock determinístico só pra a lista não nascer
// vazia. ~1 em cada 10 promotores nasce "sem venda" (vendasAno = 0) pra dar
// pra demonstrar o toggle "Ocultar sem vendas" e o badge correspondente.
function gerarMetricasMock(id: string) {
  const base = hashParaNumero(id);
  const semVendaNoPeriodo = base % 10 === 0;

  const aprovadas = 5 + (base % 60);
  const paradas90d = Math.max(0, Math.round(aprovadas * (((base >> 5) % 30) / 100)));

  if (semVendaNoPeriodo) {
    return {
      aprovadas,
      vendendo30d: 0,
      paradas90d,
      vendasMes: 0,
      vendasAno: 0,
      limite: aprovadas * 15_000,
      saudePercentual: base % 15,
    };
  }

  const vendendo30d = Math.max(1, Math.round(aprovadas * (0.3 + ((base >> 3) % 50) / 100)));
  const vendasAno = ((base % 900) + 50) * 10_000;
  const vendasMes = Math.round(vendasAno * (0.05 + ((base >> 2) % 10) / 100));
  const limite = Math.round(vendasAno * (1.2 + ((base >> 4) % 20) / 100));
  const saudePercentual = 20 + (base % 70);

  return { aprovadas, vendendo30d, paradas90d, vendasMes, vendasAno, limite, saudePercentual };
}

export const promotorListaAdapter = {
  toListaView(
    promotor: PromotorCrudView,
    gestoresPorId: Map<string, GestorOpcao>,
  ): PromotorListaView {
    const metricas = gerarMetricasMock(promotor.id);

    return {
      id: promotor.id,
      nome: promotor.nome,
      gestorNome: promotor.gestorId ? (gestoresPorId.get(promotor.gestorId)?.nome ?? null) : null,
      bases: promotor.bases,
      temAcesso: promotor.temAcesso,
      semVinculo: promotor.bases.length === 0 || !promotor.gestorId,
      semVenda: metricas.vendasAno === 0,
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
