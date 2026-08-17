import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import type { ExecutivoComCarteira } from "@/modules/gestores/adapters/gestor-detalhe.adapter";
import type { ExecutivoDaGestaoView } from "@/modules/gestores/types/gestor-executivos-tab.types";

// Mock determinístico das métricas de carteira — mesma fórmula de
// promotor-lista.adapter.ts (lista de Executivos), mas alimentada pelo
// total REAL de agências (`aprovadas`) em vez de gerar esse número também
// via hash, já que aqui a gente já sabe a carteira de verdade.
function gerarMetricasMock(id: string, aprovadas: number) {
  const base = hashParaNumero(id);
  const semVendaAno = aprovadas === 0 || base % 10 === 0;
  const paradas90d = Math.max(0, Math.round(aprovadas * (((base >> 5) % 30) / 100)));

  if (semVendaAno) {
    return {
      semVendaAno: true,
      vendendo30d: 0,
      paradas90d,
      vendasMes: 0,
      vendasAno: 0,
      limite: aprovadas * 15_000,
      saudePercentual: aprovadas > 0 ? base % 15 : 0,
    };
  }

  const vendendo30d = Math.max(1, Math.round(aprovadas * (0.3 + ((base >> 3) % 50) / 100)));
  const vendasAno = ((base % 900) + 50) * 10_000;
  const vendasMes = Math.round(vendasAno * (0.05 + ((base >> 2) % 10) / 100));
  const limite = Math.round(vendasAno * (1.2 + ((base >> 4) % 20) / 100));
  const saudePercentual = 20 + (base % 70);

  return {
    semVendaAno: false,
    vendendo30d,
    paradas90d,
    vendasMes,
    vendasAno,
    limite,
    saudePercentual,
  };
}

export const gestorExecutivosTabAdapter = {
  toView(executivo: ExecutivoComCarteira): ExecutivoDaGestaoView {
    const aprovadas = executivo.agencias.length;
    const base = hashParaNumero(executivo.id);
    const metricas = gerarMetricasMock(executivo.id, aprovadas);

    return {
      id: executivo.id,
      nome: executivo.nome,
      email: executivo.email,
      sica: executivo.sica,
      bases: executivo.bases,
      ativo: base % 10 !== 0,
      aprovadas,
      ...metricas,
    };
  },

  toViewList(executivos: ExecutivoComCarteira[]): ExecutivoDaGestaoView[] {
    return executivos.map((executivo) => gestorExecutivosTabAdapter.toView(executivo));
  },
};
