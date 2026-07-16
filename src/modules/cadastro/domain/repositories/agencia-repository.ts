import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";

// Ciclo de vida completo da agência (decisão do usuário, 2026-07-16):
// 1. em_complementar        — IA reprovou, sem contrato ainda, analista revisa manualmente.
// 2. aguardando_assinatura  — contrato gerado (pela IA ou pelo analista) e enviado, aguardando os sócios assinarem.
// 3. aguardando_validacao   — contrato assinado, analista precisa validar o contrato assinado.
// 4. aguardando_ativacao    — validado; falta só SICA/Travel Link/Usuário Master (não implementados) e clicar em ativar.
// 5. ativo / recusado       — estados finais.
export const STATUS_EM_COMPLEMENTAR = "em_complementar";
export const STATUS_AGUARDANDO_ASSINATURA = "aguardando_assinatura";
export const STATUS_AGUARDANDO_VALIDACAO = "aguardando_validacao";
export const STATUS_AGUARDANDO_ATIVACAO = "aguardando_ativacao";
export const STATUS_ATIVO = "ativo";
export const STATUS_RECUSADO = "recusado";

// Status do próprio registro de Contrato (independente do status da
// Agencia) — controla só o ciclo "gerado → assinado".
export const CONTRATO_STATUS_AGUARDANDO_ASSINATURA = "aguardando_assinatura";
export const CONTRATO_STATUS_ASSINADO = "assinado";

export type OrigemGeracaoContrato = "ia" | "humano";

export interface ContratoSignatarioData {
  nome: string;
  email: string;
  cpf: string;
}

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
  // cadastro (nesse caso o status inicial já é "aguardando_assinatura")
  // — na fila "em_complementar" não há contrato ainda.
  dadosComplementares: unknown;
  contrato: {
    provedorId: string;
    status: string;
    origemGeracao: OrigemGeracaoContrato;
    signatarios: ContratoSignatarioData[];
  } | null;
}

export interface ListarCadastrosFiltros {
  busca?: string;
  status?: string | string[];
  sortBy?: "razaoSocial" | "createdAt";
  sortDir?: "asc" | "desc";
}

export interface ListarCadastrosItem {
  agencia: Agencia;
  // Origem do contrato mais recente (se houver) — usado só pra dar
  // contexto na listagem (ex.: tooltip "gerado pela IA" vs "gerado pelo
  // analista" na fila Aguardando Assinatura).
  origemContratoAtual: OrigemGeracaoContrato | null;
}

export interface ListarCadastrosResult {
  items: ListarCadastrosItem[];
  total: number;
}

export interface CadastrosKpis {
  emComplementar: number;
  aguardandoAssinatura: number;
  aguardandoValidacao: number;
  aguardandoAtivacao: number;
  ativas: number;
  recusadas: number;
}

export interface ContratoDetalhe {
  id: string;
  provedorId: string;
  status: string;
  origemGeracao: OrigemGeracaoContrato | null;
  createdAt: Date;
}

export interface AgenciaDetalhe {
  agencia: Agencia;
  dadosComplementares: unknown;
  contratos: ContratoDetalhe[];
}

export interface AgenciaRepository {
  findByCnpj(cnpj: string): Promise<Agencia | null>;
  obterDetalhe(id: string): Promise<AgenciaDetalhe | null>;
  create(data: CreateAgenciaData): Promise<Agencia>;
  atualizarStatus(id: string, status: string): Promise<Agencia>;
  criarContrato(
    agenciaId: string,
    data: {
      provedorId: string;
      status: string;
      origemGeracao: OrigemGeracaoContrato;
      signatarios: ContratoSignatarioData[];
    },
  ): Promise<void>;
  atualizarStatusContrato(contratoId: string, status: string): Promise<void>;
  listar(filtros: ListarCadastrosFiltros): Promise<ListarCadastrosResult>;
  obterKpis(): Promise<CadastrosKpis>;
}
