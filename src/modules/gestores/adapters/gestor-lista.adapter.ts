import type { GestorView } from "@/modules/gestores/types/gestor.types";
import type { GestorListaView } from "@/modules/gestores/types/gestor-lista.types";
import { nivelSeed, type GestorNivel } from "@/modules/gestores/types/gestor-nivel.types";
import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";

// `aprovadas`(total)/`vendendo30d`/`paradas90d`/`limite`/`saudePercentual` NÃO
// são exibidos em nenhuma coluna de gestores-lista-tabela.tsx (mesma decisão
// documentada em promotor-lista.adapter.ts) — mock determinístico só pra
// manter o tipo preenchido. `vendasMes`/`vendasAno` deixaram de vir daqui em
// 2026-08-24 — agora vêm reais de `vendasPorGestor` (soma dos executivos
// subordinados, ver page.tsx/comVendasReais).
function gerarMetricasMock(id: string) {
  const base = hashParaNumero(id);

  const total = 5 + (base % 60);
  const paradas90d = Math.max(0, Math.round(total * (((base >> 5) % 30) / 100)));
  const vendendo30d = Math.max(1, Math.round(total * (0.3 + ((base >> 3) % 50) / 100)));
  const vendasAnoMock = ((base % 900) + 50) * 10_000; // só pra derivar `limite`, nunca exibido
  const limite = Math.round(vendasAnoMock * (1.2 + ((base >> 4) % 20) / 100));
  const saudePercentual = 20 + (base % 70);

  return { total, vendendo30d, paradas90d, limite, saudePercentual };
}

export const gestorListaAdapter = {
  toListaView(
    gestor: GestorView,
    executivosPorGestor: Record<string, number>,
    vendasPorGestor: Record<string, { vendasMes: number; vendasAno: number }>,
    nivelOverrides: Record<string, GestorNivel>,
  ): GestorListaView {
    const nivel = nivelOverrides[gestor.id] ?? nivelSeed(gestor.id);
    const metricas = gerarMetricasMock(gestor.id);
    const vendas = vendasPorGestor[gestor.id] ?? { vendasMes: 0, vendasAno: 0 };

    return {
      id: gestor.id,
      nome: gestor.nome,
      temAcesso: gestor.temAcesso,
      bases: gestor.bases,
      nivel,
      executivos: executivosPorGestor[gestor.id] ?? 0,
      semVenda: vendas.vendasAno === 0,
      vendasMes: vendas.vendasMes,
      vendasAno: vendas.vendasAno,
      ...metricas,
    };
  },

  toListaViewList(
    gestores: GestorView[],
    executivosPorGestor: Record<string, number>,
    vendasPorGestor: Record<string, { vendasMes: number; vendasAno: number }>,
    nivelOverrides: Record<string, GestorNivel>,
  ): GestorListaView[] {
    return gestores.map((gestor) =>
      gestorListaAdapter.toListaView(gestor, executivosPorGestor, vendasPorGestor, nivelOverrides),
    );
  },
};
