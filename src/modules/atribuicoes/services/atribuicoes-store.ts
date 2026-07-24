import cidadesRaw from "@/modules/atribuicoes/data/cidades-mapa-comercial.json";
import type { Cidade, SubstituicaoHistorico } from "@/modules/atribuicoes/types/atribuicao.types";

// "Banco" em memória — mesmo padrão do /eventos e /atendimento (decisão
// do usuário, 2026-07-23): mutações (substituir executivo/gestor) vivem
// só no processo do servidor, resetam a cada restart do dev server. Sem
// tabela própria no banco ainda; troque por persistência real quando o
// back-end desse módulo existir.
let cidades: Cidade[] = (cidadesRaw as Cidade[]).map((cidade) => ({ ...cidade }));
let historico: SubstituicaoHistorico[] = [];

export function obterCidades(): Cidade[] {
  return cidades;
}

export function obterHistorico(): SubstituicaoHistorico[] {
  return [...historico].reverse();
}

export function substituirExecutivo(nomeAntigo: string, nomeNovo: string): number {
  let afetadas = 0;
  cidades = cidades.map((cidade) => {
    if (cidade.executivo !== nomeAntigo) return cidade;
    afetadas += 1;
    return { ...cidade, executivo: nomeNovo };
  });

  historico.push({
    tipo: "executivo",
    nomeAntigo,
    nomeNovo,
    totalCidadesAfetadas: afetadas,
    data: new Date().toISOString(),
  });

  return afetadas;
}

export function substituirGestor(nomeAntigo: string, nomeNovo: string): number {
  let afetadas = 0;
  cidades = cidades.map((cidade) => {
    if (cidade.gestor !== nomeAntigo) return cidade;
    afetadas += 1;
    return { ...cidade, gestor: nomeNovo };
  });

  historico.push({
    tipo: "gestor",
    nomeAntigo,
    nomeNovo,
    totalCidadesAfetadas: afetadas,
    data: new Date().toISOString(),
  });

  return afetadas;
}

export function substituirBase(nomeAntigo: string, nomeNovo: string): number {
  let afetadas = 0;
  cidades = cidades.map((cidade) => {
    if (cidade.base !== nomeAntigo) return cidade;
    afetadas += 1;
    return { ...cidade, base: nomeNovo };
  });

  historico.push({
    tipo: "base",
    nomeAntigo,
    nomeNovo,
    totalCidadesAfetadas: afetadas,
    data: new Date().toISOString(),
  });

  return afetadas;
}
