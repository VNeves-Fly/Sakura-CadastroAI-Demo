import type { GestorView } from "@/modules/gestores/types/gestor.types";
import type { GestorListaView } from "@/modules/gestores/types/gestor-lista.types";
import { nivelSeed, type GestorNivel } from "@/modules/gestores/types/gestor-nivel.types";
import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";

// Métricas de carteira SEM fonte real hoje (mesma decisão documentada em
// promotor-lista.adapter.ts para Executivos) — mock determinístico a partir
// do id, sempre calculado (mascarado via SensitiveValue quando o toggle
// global de visibilidade estiver oculto).
function gerarMetricasMock(id: string) {
  const base = hashParaNumero(id);
  const semVendaNoPeriodo = base % 10 === 0;

  const total = 5 + (base % 60);
  const paradas90d = Math.max(0, Math.round(total * (((base >> 5) % 30) / 100)));

  if (semVendaNoPeriodo) {
    return {
      semVenda: true,
      total,
      vendendo30d: 0,
      paradas90d,
      vendasMes: 0,
      vendasAno: 0,
      limite: total * 15_000,
      saudePercentual: base % 15,
    };
  }

  const vendendo30d = Math.max(1, Math.round(total * (0.3 + ((base >> 3) % 50) / 100)));
  const vendasAno = ((base % 900) + 50) * 10_000;
  const vendasMes = Math.round(vendasAno * (0.05 + ((base >> 2) % 10) / 100));
  const limite = Math.round(vendasAno * (1.2 + ((base >> 4) % 20) / 100));
  const saudePercentual = 20 + (base % 70);

  return {
    semVenda: false,
    total,
    vendendo30d,
    paradas90d,
    vendasMes,
    vendasAno,
    limite,
    saudePercentual,
  };
}

export const gestorListaAdapter = {
  toListaView(
    gestor: GestorView,
    executivosPorGestor: Record<string, number>,
    nivelOverrides: Record<string, GestorNivel>,
    ativoOverrides: Record<string, boolean>,
  ): GestorListaView {
    const nivel = nivelOverrides[gestor.id] ?? nivelSeed(gestor.id);
    const metricas = gerarMetricasMock(gestor.id);

    return {
      id: gestor.id,
      nome: gestor.nome,
      temAcesso: gestor.temAcesso,
      bases: gestor.bases,
      nivel,
      ativo: ativoOverrides[gestor.id] ?? true,
      executivos: executivosPorGestor[gestor.id] ?? 0,
      ...metricas,
    };
  },

  toListaViewList(
    gestores: GestorView[],
    executivosPorGestor: Record<string, number>,
    nivelOverrides: Record<string, GestorNivel>,
    ativoOverrides: Record<string, boolean>,
  ): GestorListaView[] {
    return gestores.map((gestor) =>
      gestorListaAdapter.toListaView(gestor, executivosPorGestor, nivelOverrides, ativoOverrides),
    );
  },
};
