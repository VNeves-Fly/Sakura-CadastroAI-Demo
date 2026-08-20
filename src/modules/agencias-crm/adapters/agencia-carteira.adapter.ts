import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import type {
  AgenciaCarteiraView,
  CanalVendas,
  CategoriaPremiacao,
} from "@/modules/agencias-crm/types/agencia-carteira.types";

const CATEGORIAS: CategoriaPremiacao[] = ["10K", "100K", "1M", "10M"];
const CANAIS: CanalVendas[] = ["aereo", "terrestre", "ambos"];
const STATUS_DADOS_FALTANTES = new Set(["em_analise", "em_complementar"]);

// Sem fonte real de motivo de reprovação na listagem hoje — o dado existe
// (AnaliseIaAgencia.motivo), mas ListarCadastrosUseCase não resolve essa
// relação em lote (só usada no dossiê de uma agência por vez, ver
// obterDetalhe). Mock só pra a coluna "Motivo" da aba Reprovadas não
// nascer vazia; trocar por dado real é estender a query de listagem, não
// mudar este adapter.
const MOTIVOS_MOCK = [
  "CNPJ com pendência na Receita Federal",
  "Documentação societária incompleta",
  "Score de crédito abaixo do mínimo",
  "Duplicidade de cadastro (CNPJ já ativo)",
  "Endereço não confirmado",
  "Contrato social desatualizado",
];

export interface ExecutivoResumo {
  nome: string;
  bases: string[];
}

// Um item já resolvido por ListarCadastrosUseCase (fonte real, mesma de
// /cadastros) — só os campos que este adapter de fato usa.
export interface AgenciaCarteiraRaw {
  id: string;
  razaoSocial: string;
  cnpj: string;
  status: string;
  createdAt: Date;
  executivoId: string | null;
  executivoNome: string | null;
  executivoGestor: string | null;
}

// regiaoPorBase: sigla da Base -> região (derivada de Base.uf, real — ver
// regiao-por-uf.util.ts), resolvida uma vez pelo loader e repassada aqui.
export function montarAgenciaCarteiraView(
  item: AgenciaCarteiraRaw,
  executivoPorId: Map<string, ExecutivoResumo>,
  regiaoPorBase: Map<string, string | null>,
): AgenciaCarteiraView {
  const seed = hashParaNumero(item.id);
  const reprovadaOuInativa = item.status === "recusado";
  const dadosFaltantes = STATUS_DADOS_FALTANTES.has(item.status);

  // Base "da agência" é melhor esforço, não dado real — mesma aproximação
  // (primeira base do executivo) já usada em executivo-agencias.adapter.ts
  // e gestor-agencias-tab.adapter.ts, já que Agencia não guarda a própria
  // base (ver ListarCadastrosItem.executivoBase, sempre null).
  const base = item.executivoId ? (executivoPorId.get(item.executivoId)?.bases[0] ?? null) : null;
  const regiao = base ? (regiaoPorBase.get(base) ?? null) : null;

  const semVenda = seed % 10 === 0;
  const bilhetes = semVenda ? 0 : 5 + (seed % 400);
  const vendasAno = semVenda ? 0 : ((seed % 900) + 20) * 10_000;
  const vendasMes = semVenda ? 0 : Math.round(vendasAno * (0.05 + ((seed >> 2) % 10) / 100));
  const ticketMedio = bilhetes > 0 ? Math.round(vendasAno / bilhetes) : 0;
  const limite = Math.round(vendasAno * (1.1 + ((seed >> 4) % 30) / 100));
  const diasSemComprar = semVenda ? 90 + (seed % 300) : seed % 400;

  return {
    id: item.id,
    razaoSocial: item.razaoSocial,
    cnpj: item.cnpj,
    status: item.status,
    dadosFaltantes,
    reprovadaOuInativa,
    executivoId: item.executivoId,
    executivoNome: item.executivoNome,
    gestorNome: item.executivoGestor,
    base,
    regiao,
    createdAt: item.createdAt.toISOString(),
    motivo: reprovadaOuInativa ? (MOTIVOS_MOCK[seed % MOTIVOS_MOCK.length] ?? null) : null,
    categoria: semVenda ? null : CATEGORIAS[seed % CATEGORIAS.length]!,
    canal: CANAIS[(seed >> 3) % CANAIS.length]!,
    bilhetes,
    ticketMedio,
    vendasMes,
    vendasAno,
    diasSemComprar,
    limite,
  };
}

export function montarAgenciasCarteiraViewList(
  itens: AgenciaCarteiraRaw[],
  executivoPorId: Map<string, ExecutivoResumo>,
  regiaoPorBase: Map<string, string | null>,
): AgenciaCarteiraView[] {
  return itens.map((item) => montarAgenciaCarteiraView(item, executivoPorId, regiaoPorBase));
}
