import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";

// Modelo de filas simplificado (substituiu o funil numérico de 5 etapas
// — decisão do usuário, 2026-07-16): a IA avalia o cadastro no envio e
// decide entre duas filas; não existe mais um funil de progresso linear.
export const STATUS_EM_COMPLEMENTAR = "em_complementar";
export const STATUS_AGUARDANDO_ASSINATURA = "aguardando_assinatura";
export const STATUS_AGUARDANDO_VALIDACAO = "aguardando_validacao";
export const STATUS_ATIVO = "ativo";
export const STATUS_RECUSADO = "recusado";

export interface CreateAgenciaData {
  razaoSocial: string;
  cnpj: string;
  status: string;
  contratoSocialPath: string;
  emailContato: string;
  telefoneContato: string;
  origem: string | null;
  // Gravado atomicamente junto (CadastroComplementar e, se houver,
  // Contrato), numa única escrita aninhada do Prisma — não existe
  // intervalo entre eles. Contrato só existe quando a IA já aprovou o
  // cadastro (fila "aguardando_assinatura") — na fila "em_complementar"
  // não há contrato ainda.
  dadosComplementares: unknown;
  contrato: {
    provedorId: string;
    status: string;
    signatarios: unknown;
  } | null;
}

export interface ListarCadastrosFiltros {
  busca?: string;
  status?: string | string[];
  sortBy?: "razaoSocial" | "createdAt";
  sortDir?: "asc" | "desc";
}

export interface ListarCadastrosResult {
  items: Agencia[];
  total: number;
}

export interface CadastrosKpis {
  emComplementar: number;
  aguardandoAssinatura: number;
  aguardandoValidacao: number;
  ativas: number;
  recusadas: number;
}

export interface AgenciaDetalhe {
  agencia: Agencia;
  dadosComplementares: unknown;
  contratos: Array<{
    id: string;
    provedorId: string;
    status: string;
    createdAt: Date;
  }>;
}

export interface AgenciaRepository {
  findByCnpj(cnpj: string): Promise<Agencia | null>;
  obterDetalhe(id: string): Promise<AgenciaDetalhe | null>;
  create(data: CreateAgenciaData): Promise<Agencia>;
  atualizarStatus(id: string, status: string): Promise<Agencia>;
  criarContrato(
    agenciaId: string,
    data: { provedorId: string; status: string; signatarios: unknown },
  ): Promise<void>;
  listar(filtros: ListarCadastrosFiltros): Promise<ListarCadastrosResult>;
  obterKpis(): Promise<CadastrosKpis>;
}
