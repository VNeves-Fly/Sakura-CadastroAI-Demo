import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";

export interface CreateAgenciaData {
  razaoSocial: string;
  cnpj: string;
  contratoSocialPath: string;
  emailContato: string;
  telefoneContato: string;
  origem: string | null;
  // Gravado atomicamente junto (CadastroComplementar e Contrato), numa
  // única escrita aninhada do Prisma — não existe intervalo entre eles.
  dadosComplementares: unknown;
  contrato: {
    provedorId: string;
    status: string;
    signatarios: unknown;
  };
}

export interface ListarCadastrosFiltros {
  busca?: string;
  etapa?: number | number[];
  sortBy?: "razaoSocial" | "etapaAtual" | "createdAt";
  sortDir?: "asc" | "desc";
}

export interface ListarCadastrosResult {
  items: Agencia[];
  total: number;
}

// Contadores das etapas 1-4 (ativas). A Etapa 5 (aprovado) sai da
// listagem assim que a agência é arquivada — não entra no funil.
export interface CadastrosFunil {
  etapa1: number;
  etapa2: number;
  etapa3: number;
  etapa4: number;
}

export interface CadastrosKpis {
  emAnalise: number;
  reprovadas: number;
  aprovadas: number;
  aguardandoAprovacaoFinal: number;
}

export interface AgenciaRepository {
  findByCnpj(cnpj: string): Promise<Agencia | null>;
  create(data: CreateAgenciaData): Promise<Agencia>;
  listar(filtros: ListarCadastrosFiltros): Promise<ListarCadastrosResult>;
  obterKpis(): Promise<CadastrosKpis>;
  obterFunil(): Promise<CadastrosFunil>;
}
