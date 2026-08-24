// Fixture temporária SÓ pra revisão visual de design (pedido do usuário,
// 2026-08-21: "mocka uma lista de agências em /agencias pra gente
// conferir o design" + "/executivos" + "/novas agencias", com o pedido
// explícito de que as 3 listas "convirjam" pra /agencias — ou seja, usem
// as MESMAS identidades de agência, não conjuntos inventados
// separadamente). Não é consumida por nenhuma rota real — só pelas rotas
// de preview em src/app/preview-*-mock/, feitas pra apagar depois da
// revisão. Nenhum destes nomes/CNPJs corresponde a agência real.

import type { AgenciaCarteiraView as AgenciaCarteiraViewCrm } from "@/modules/agencias-crm/types/agencia-carteira.types";
import type { AgenciaCarteiraView as AgenciaCarteiraViewExecutivo } from "@/modules/atribuicoes/types/executivo-agencias.types";
import type { AgenciaDaGestaoView } from "@/modules/gestores/types/gestor-agencias-tab.types";
import type { AgenciaNovaLinha } from "@/modules/novas-agencias/types/novas-agencias.types";

interface IdentidadeBase {
  id: string;
  nome: string; // razão social
  cnpj: string;
  sica: string;
  base: string | null;
  cidadeUf: string;
  executivoNome: string | null;
  gestorNome: string | null;
  ativo: boolean; // false = "recusado"/"inativo" conforme o módulo
  vendasMes: number;
  vendasAno: number;
  margemPct: number;
  margemLYPct: number;
  margemVariacaoPct: number;
  createdAt: string;
  entrada: string;
  primeiraCompra: string | null;
}

const BASES: [base: string, cidadeUf: string][] = [
  ["GRU", "São Paulo/SP"],
  ["GIG", "Rio de Janeiro/RJ"],
  ["CNF", "Belo Horizonte/MG"],
  ["POA", "Porto Alegre/RS"],
  ["SSA", "Salvador/BA"],
  ["REC", "Recife/PE"],
  ["FOR", "Fortaleza/CE"],
  ["CWB", "Curitiba/PR"],
];

const DUPLAS_EXEC_GESTOR: [executivo: string | null, gestor: string][] = [
  ["Marina Costa", "Douglas Mendes"],
  ["Rafael Andrade", "Douglas Mendes"],
  ["Juliana Ferreira", "Patrícia Lima"],
  ["Thiago Souza", "Patrícia Lima"],
  ["Camila Rocha", "Eduardo Martins"],
  ["Bruno Cardoso", "Eduardo Martins"],
  [null, "Patrícia Lima"], // "não definido" — testa o âmbar da coluna Executivo
];

const NOMES = [
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

const BASE_IDENTIDADES: IdentidadeBase[] = NOMES.map((nome, indice) => {
  const [base, cidadeUf] = BASES[indice % BASES.length]!;
  const [executivoNome, gestorNome] = DUPLAS_EXEC_GESTOR[indice % DUPLAS_EXEC_GESTOR.length]!;
  const semVenda = indice % 9 === 6;
  const ativo = indice % 4 !== 3; // ~75% ativo, resto "recusado"/"inativo"
  const vendasAno = semVenda ? 0 : ((indice % 37) + 4) * 42_000;
  const vendasMes = semVenda ? 0 : Math.round(vendasAno * (0.06 + ((indice * 7) % 10) / 100));
  const margemPct = Math.round((1.8 + ((indice * 13) % 90) / 10) * 100) / 100;
  const margemVariacaoPct = Math.round((indice % 2 === 0 ? 1 : -1) * (2 + (indice % 20)) * 10) / 10;
  const margemLYPct = Math.round((margemPct - margemVariacaoPct / 10) * 100) / 100;
  const dia = 1 + (indice % 27);
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
    margemPct,
    margemLYPct,
    margemVariacaoPct,
    createdAt: new Date(2026, indice % 12, dia).toISOString(),
    entrada: `${String(dia).padStart(2, "0")}/0${(indice % 8) + 1}/2026`,
    primeiraCompra: semVenda
      ? null
      : `${String((dia % 27) + 1).padStart(2, "0")}/0${(indice % 8) + 1}/2026`,
  };
});

// Subconjunto que aparece igual (mesmo id/nome) em Executivo, Gestor e
// Novas Agências — é isso que faz as 3 listas "convergirem" pra /agencias:
// não são agências inventadas à parte, são as mesmas 10 primeiras daqui.
const SUBCONJUNTO_COMPARTILHADO = BASE_IDENTIDADES.slice(0, 10);

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

export const MOCK_AGENCIAS_CRM: AgenciaCarteiraViewCrm[] = BASE_IDENTIDADES.map((a) => ({
  id: a.id,
  razaoSocial: a.nome,
  cnpj: a.cnpj,
  status: a.ativo ? "ativo" : "recusado",
  dadosFaltantes: false,
  reprovadaOuInativa: !a.ativo,
  executivoId: a.executivoNome
    ? `exec-${a.executivoNome.replace(/\s+/g, "-").toLowerCase()}`
    : null,
  executivoNome: a.executivoNome,
  gestorNome: a.gestorNome,
  base: a.base,
  regiao: null,
  createdAt: a.createdAt,
  motivo: a.ativo ? null : "Documentação societária incompleta",
  categoria: a.vendasAno >= 1_000_000 ? "1M" : a.vendasAno >= 100_000 ? "100K" : "10K",
  canal: "aereo",
  bilhetes: Math.round(a.vendasAno / 4_500),
  ticketMedio:
    a.vendasAno > 0 ? Math.round(a.vendasAno / Math.max(1, Math.round(a.vendasAno / 4_500))) : 0,
  vendasMes: a.vendasMes,
  vendasAno: a.vendasAno,
  diasSemComprar: a.vendasAno === 0 ? 180 : 5,
  limite: Math.round(a.vendasAno * 1.2),
  sica: a.sica,
  margemPct: a.margemPct,
  margemLYPct: a.margemLYPct,
  margemVariacaoPct: a.margemVariacaoPct,
}));

export const MOCK_AGENCIAS_EXECUTIVO: AgenciaCarteiraViewExecutivo[] =
  SUBCONJUNTO_COMPARTILHADO.map((a) => ({
    id: a.id,
    nome: a.nome,
    cnpj: a.cnpj,
    status: a.ativo ? "ativo" : "inativo",
    canal: "aereo",
    faixaRecencia: a.vendasAno === 0 ? "semVenda365d" : "ate30d",
    categoria: a.vendasAno >= 1_000_000 ? "1M" : a.vendasAno >= 100_000 ? "100K" : "10K",
    vendasAno: a.vendasAno,
    bilhetesAno: Math.round(a.vendasAno / 4_500),
    vendas90d: Math.round(a.vendasAno * 0.25),
    bilhetes90d: Math.round(a.vendasAno / 4_500 / 4),
    vendas30d: a.vendasMes,
    bilhetes30d: Math.round(a.vendasMes / 4_500),
    limite: Math.round(a.vendasAno * 1.2),
  }));

export const MOCK_AGENCIAS_GESTOR: AgenciaDaGestaoView[] = SUBCONJUNTO_COMPARTILHADO.map((a) => ({
  id: a.id,
  nome: a.nome,
  cnpj: a.cnpj,
  executivoId: a.executivoNome ? `exec-${a.executivoNome.replace(/\s+/g, "-").toLowerCase()}` : "",
  executivoNome: a.executivoNome ?? "não definido",
  base: a.base,
  status: a.ativo ? "ativo" : "inativo",
  dadosFaltantes: false,
  inativada: !a.ativo,
  categoria: a.vendasAno >= 1_000_000 ? "1M" : a.vendasAno >= 100_000 ? "100K" : "10K",
  vendasAno: a.vendasAno,
  bilhetesAno: Math.round(a.vendasAno / 4_500),
  faixaRecencia: a.vendasAno === 0 ? "semVenda365d" : "ate30d",
  limite: Math.round(a.vendasAno * 1.2),
}));

export const MOCK_AGENCIAS_NOVAS: AgenciaNovaLinha[] = SUBCONJUNTO_COMPARTILHADO.map((a) => ({
  id: a.id,
  nome: a.nome.toUpperCase(),
  meta: `${a.cnpj} · ERP ${a.sica} · ${a.cidadeUf}`,
  executivo: a.executivoNome ?? "não definido",
  gerente: a.gestorNome ?? "—",
  entrada: a.entrada,
  primeiraCompra: a.primeiraCompra ?? "—",
  volume: formatarMoeda(a.vendasMes),
  situacao: a.vendasAno === 0 ? "nunca" : a.vendasMes > 0 ? "comprando" : "parou",
}));
