// Identidades fictícias canônicas do CRM demo — nenhum nome/CNPJ/SICA
// aqui corresponde a agência real. É a fonte única de dados para todas as
// páginas de /crm/agencias, /crm/novas-agencias e para o portfólio de
// agências mostrado em /crm/executivos e /crm/gestores — por isso as
// mesmas 25 identidades "convergem" entre as telas (mesmo id/nome em
// qualquer lista onde a agência aparecer).
//
// Substitui a antiga fixture de dev `src/dev/mock-agencias-fixture.ts`
// (criada só para revisão visual, nunca consumida pelas rotas reais) —
// agora é a fonte de dados de verdade, porque este repositório é uma
// demonstração e não deve depender de SST/Postgres para o que exibe.

import type { AgenciaCarteiraView } from "@/modules/agencias-crm/types/agencia-carteira.types";
import type { AgenciaCarteiraView as AgenciaCarteiraViewExecutivo } from "@/modules/atribuicoes/types/executivo-agencias.types";

export const BASES_MOCK: [base: string, cidadeUf: string][] = [
  ["GRU", "São Paulo/SP"],
  ["GIG", "Rio de Janeiro/RJ"],
  ["CNF", "Belo Horizonte/MG"],
  ["POA", "Porto Alegre/RS"],
  ["SSA", "Salvador/BA"],
  ["REC", "Recife/PE"],
  ["FOR", "Fortaleza/CE"],
  ["CWB", "Curitiba/PR"],
];

// Duplas executivo→gestor usadas em toda a área de CRM mock (agências,
// executivos, gestores) — nomes precisam bater entre `agencias.mock-data`
// e `pessoas.mock-data` para os drill-downs convergirem.
export const DUPLAS_EXEC_GESTOR_MOCK: [executivo: string | null, gestor: string][] = [
  ["Marina Costa", "Douglas Mendes"],
  ["Rafael Andrade", "Douglas Mendes"],
  ["Juliana Ferreira", "Patrícia Lima"],
  ["Thiago Souza", "Patrícia Lima"],
  ["Camila Rocha", "Eduardo Martins"],
  ["Bruno Cardoso", "Eduardo Martins"],
  [null, "Patrícia Lima"], // "não definido" — testa o âmbar da coluna Executivo
];

const NOMES_MOCK = [
  "Horizonte Sul Viagens",
  "Estrela Norte Turismo",
  "Caminho das Águas Turismo",
  "Vale Verde Viagens",
  "Porto Seguro Turismo Ltda",
  "Nova Aurora Viagens",
  "Trilha Real Turismo",
  "Costa Dourada Viagens",
  "Rota Azul Turismo",
  "Terra Firme Viagens",
  "Bela Vista Turismo",
  "Ponte Alta Viagens",
  "Serra Azul Turismo",
  "Mar Aberto Viagens",
  "Campo Largo Turismo",
  "Rio Claro Viagens",
  "Monte Verde Turismo",
  "Praia Bonita Viagens",
  "Vento Sul Turismo",
  "Lagoa Dourada Viagens",
  "Fronteira Nova Turismo",
  "Céu Aberto Viagens",
  "Ponta Negra Turismo",
  "Águas Claras Viagens",
];

function cnpjFake(indice: number): string {
  const bloco = String(10_000_000 + indice * 137_913).padStart(8, "0");
  return `${bloco}/0001-${String(10 + (indice % 89)).padStart(2, "0")}`;
}

export function executivoIdMock(nome: string): string {
  return `exec-${nome.replace(/\s+/g, "-").toLowerCase()}`;
}

export function gestorIdMock(nome: string): string {
  return `gestor-${nome.replace(/\s+/g, "-").toLowerCase()}`;
}

export interface IdentidadeAgenciaMock {
  id: string;
  nome: string;
  cnpj: string;
  sica: string;
  base: string;
  cidadeUf: string;
  executivoNome: string | null;
  gestorNome: string;
  ativo: boolean; // false = "inativo"/"recusado" conforme a tela
  vendasMes: number;
  vendasAno: number;
  entradaEm: Date;
  primeiraCompraEm: Date | null;
}

export const IDENTIDADES_AGENCIAS_MOCK: IdentidadeAgenciaMock[] = NOMES_MOCK.map((nome, indice) => {
  const [base, cidadeUf] = BASES_MOCK[indice % BASES_MOCK.length]!;
  const [executivoNome, gestorNome] =
    DUPLAS_EXEC_GESTOR_MOCK[indice % DUPLAS_EXEC_GESTOR_MOCK.length]!;
  const semVenda = indice % 9 === 6;
  const ativo = indice % 4 !== 3; // ~75% ativo, resto "inativo"
  const vendasAno = semVenda ? 0 : ((indice % 37) + 4) * 42_000;
  const vendasMes = semVenda ? 0 : Math.round(vendasAno * (0.06 + ((indice * 7) % 10) / 100));
  const diaEntrada = 1 + (indice % 27);
  const entradaEm = new Date(2026, indice % 12, diaEntrada);
  const primeiraCompraEm = semVenda
    ? null
    : new Date(entradaEm.getTime() + (1 + (indice % 20)) * 86_400_000);

  return {
    id: `mock-ag-${String(indice + 1).padStart(2, "0")}`,
    nome,
    cnpj: cnpjFake(indice),
    sica: String(40_001 + indice),
    base,
    cidadeUf,
    executivoNome,
    gestorNome,
    ativo,
    vendasMes,
    vendasAno,
    entradaEm,
    primeiraCompraEm,
  };
});

// Subconjunto que aparece igual (mesmo id/nome) em Executivo, Gestor e
// Novas Agências — é isso que faz essas listas "convergirem" com
// /crm/agencias: não são agências inventadas à parte, são as mesmas 10
// primeiras daqui.
export const IDENTIDADES_AGENCIAS_COMPARTILHADAS = IDENTIDADES_AGENCIAS_MOCK.slice(0, 10);

function categoriaPorVendasAno(vendasAno: number): "10K" | "100K" | "1M" {
  if (vendasAno >= 1_000_000) return "1M";
  if (vendasAno >= 100_000) return "100K";
  return "10K";
}

export const MOCK_AGENCIAS_CRM: AgenciaCarteiraView[] = IDENTIDADES_AGENCIAS_MOCK.map((a) => {
  const bilhetes = a.vendasAno > 0 ? Math.round(a.vendasAno / 4_500) : 0;
  return {
    id: a.id,
    razaoSocial: a.nome,
    cnpj: a.cnpj,
    status: a.ativo ? "ativo" : "inativo",
    dadosFaltantes: false,
    reprovadaOuInativa: !a.ativo,
    executivoId: a.executivoNome ? executivoIdMock(a.executivoNome) : null,
    executivoNome: a.executivoNome,
    gestorNome: a.gestorNome,
    base: a.base,
    regiao: null,
    categoria: null,
    canal: a.vendasAno > 0 ? "aereo" : null,
    bilhetes,
    ticketMedio: bilhetes > 0 ? Math.round(a.vendasAno / bilhetes) : 0,
    vendasMes: a.vendasMes,
    vendasAno: a.vendasAno,
    diasSemComprar: a.vendasAno > 0 ? 5 + (bilhetes % 60) : null,
    limite: 0,
    sica: a.sica,
  };
});

export const MOCK_AGENCIAS_EXECUTIVO: AgenciaCarteiraViewExecutivo[] =
  IDENTIDADES_AGENCIAS_COMPARTILHADAS.map((a) => {
    const bilhetesAno = a.vendasAno > 0 ? Math.round(a.vendasAno / 4_500) : 0;
    return {
      id: a.id,
      nome: a.nome,
      cnpj: a.cnpj,
      status: a.ativo ? "ativo" : "inativo",
      canal: a.vendasAno > 0 ? "aereo" : "nenhum",
      faixaRecencia: a.vendasAno === 0 ? "semVenda365d" : "ate30d",
      categoria: categoriaPorVendasAno(a.vendasAno),
      vendasAno: a.vendasAno,
      bilhetesAno,
      vendas90d: Math.round(a.vendasAno * 0.25),
      bilhetes90d: Math.round(bilhetesAno / 4),
      vendas30d: a.vendasMes,
      bilhetes30d: Math.round(a.vendasMes / 4_500),
      limite: Math.round(a.vendasAno * 1.2),
    };
  });
