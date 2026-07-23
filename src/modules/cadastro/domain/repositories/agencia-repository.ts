import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type { OrigemGeracaoContrato } from "@/modules/cadastro/domain/enums";
import type { DocumentAnalysisResultado } from "@/modules/cadastro/domain/services/document-analysis-service";
import type { AnaliseIaResultado } from "@/modules/cadastro/domain/services/analise-ia-service";

export type { OrigemGeracaoContrato };

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
// Agencia) — controla o ciclo "gerado → assinado". `assinado_agencia` é o
// estágio intermediário: o aprovador (papel APROVAR, estágio 1) assinou,
// mas os signatários fixos restantes (estágio 2, testemunhas) ainda não
// terminaram — ver ProcessarWebhookD4SignUseCase.
export const CONTRATO_STATUS_AGUARDANDO_ASSINATURA = "aguardando_assinatura";
export const CONTRATO_STATUS_ASSINADO_AGENCIA = "assinado_agencia";
export const CONTRATO_STATUS_ASSINADO = "assinado";

export interface ContratoSignatarioData {
  nome: string;
  email: string;
  cpf: string;
}

export interface EnderecoData {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface EmpresaData {
  telefoneComercial: string;
  emailOperacional: string;
  emailComercial: string;
  emailFinanceiro: string;
}

export interface SocioData {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  dataNascimento: Date | null;
  estadoCivil: string;
  endereco: EnderecoData;
  isRepresentanteLegal: boolean;
  rgPath: string;
  // Bucket onde rgPath/procuracaoPath foram salvos (ver SavedFile) — vai
  // pro Documento.gcsBucket, pra sempre saber em qual bucket o arquivo
  // está de verdade mesmo que GCS_BUCKET_NAME mude depois do upload.
  rgBucket: string | null;
  procuracaoPath: string | null;
  procuracaoBucket: string | null;
  // Resultado do documentAnalysisService.analisar() sobre o RG deste
  // sócio — o repository grava como AnaliseIaDocumento vinculada ao
  // Documento real dentro da mesma transação (precisa do id gerado no
  // create, por isso não é gravado direto no use-case).
  analiseIa: DocumentAnalysisResultado | null;
}

export interface EnderecoBancoData {
  enderecoMesmoSocio: boolean;
  // Índice em `socios` (abaixo) do sócio dono do endereço vinculado — o
  // repository resolve pro id real de RepresentanteLegal já criado antes
  // de gravar o FK (ver PrismaAgenciaRepository.create).
  socioEnderecoVinculadoIndex: number | null;
  endereco: EnderecoData;
  bancoPais: string;
  bancoNome: string;
  bancoAgencia: string;
  bancoConta: string;
  bancoSwift: string;
  tipoConta: string;
  favorecidoEhEmpresa: boolean;
  favorecidoNome: string;
  favorecidoDoc: string;
}

export interface CreateAgenciaData {
  razaoSocial: string;
  cnpj: string;
  status: string;
  contratoSocialPath: string;
  // Ver comentário em SocioData.rgBucket.
  contratoSocialBucket: string | null;
  emailContato: string;
  telefoneContato: string;
  origem: string | null;
  // Gravado atomicamente junto (Agencia + sócios + CadastroComplementar
  // e, se houver, Contrato), numa transação — não existe intervalo entre
  // eles. Contrato só existe quando a IA já aprovou o cadastro (nesse
  // caso o status inicial já é "aguardando_assinatura") — na fila
  // "em_complementar" não há contrato ainda.
  empresa: EmpresaData;
  socios: SocioData[];
  // Resultado do documentAnalysisService.analisar() sobre o contrato
  // social — mesma lógica de SocioData.analiseIa.
  analiseIaContratoSocial: DocumentAnalysisResultado | null;
  // Veredito final do analiseIaService.avaliar() (parecer/motivo/flags de
  // risco + detalhamento do cruzamento) — grava como AnaliseIaAgencia na
  // mesma transação, pra dar contexto ao analista quando o parecer não é
  // APROVADO. Null só no mock que não popula parecer estruturado.
  analiseIaFinal: AnaliseIaResultado | null;
  enderecoBanco: EnderecoBancoData;
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
  origemGeracao: OrigemGeracaoContrato;
  createdAt: Date;
}

export interface RepresentanteLegalDetalhe {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  estadoCivil: string;
  isRepresentanteLegal: boolean;
  endereco: EnderecoData;
  // Documento "atual" de cada slot (o mais recente por tipo+sócio) — pode
  // ser null se o cliente ainda não reenviou depois de uma reprovação.
  rg: Documento | null;
  procuracao: Documento | null;
  // Dado digitado (não o arquivo) — hoje nenhum wizard (/cadastro, /chat)
  // pergunta isso, então vem null pra praticamente todo sócio existente.
  // Exposto mesmo assim pra já refletir automaticamente o dia em que
  // algum fluxo passar a coletar.
  rgNumero: string | null;
  rgOrgaoEmissor: string | null;
  dataNascimento: Date | null;
}

export interface CadastroComplementarDetalhe {
  telefoneComercial: string | null;
  emailOperacional: string | null;
  emailComercial: string | null;
  emailFinanceiro: string | null;
  enderecoAgencia: EnderecoData;
  enderecoAgenciaMesmoTitular: boolean | null;
  socioVinculadoEnderecoId: string | null;
  bancoPais: string | null;
  bancoNome: string | null;
  bancoAgencia: string | null;
  bancoConta: string | null;
  bancoSwift: string | null;
  tipoConta: string | null;
  favorecidoEhEmpresa: boolean | null;
  favorecidoNome: string | null;
  favorecidoDoc: string | null;
}

export interface AgenciaDetalhe {
  agencia: Agencia;
  complementar: CadastroComplementarDetalhe | null;
  representantesLegais: RepresentanteLegalDetalhe[];
  // Documento do contrato social — mesma lógica de "mais recente por
  // slot" dos documentos de sócio (ver RepresentanteLegalDetalhe).
  contratoSocial: Documento | null;
  contratos: ContratoDetalhe[];
}

// Ponto diário do gráfico de fluxo de contratos — só dado real, contado
// a partir de Contrato.createdAt/status (nada estimado).
export interface AnaliseContratosPorDia {
  dia: string; // "dd/MM"
  assinados: number;
  pendentes: number;
}

export interface AnaliseContratos {
  porOrigem: { ia: number; humano: number };
  porDia: AnaliseContratosPorDia[];
}

export interface ContratoPorProvedorId {
  agenciaId: string;
  contratoId: string;
}

export interface AgenciaRepository {
  findByCnpj(cnpj: string): Promise<Agencia | null>;
  findById(id: string): Promise<Agencia | null>;
  // provedorId = uuid do documento no D4Sign (Contrato.provedorId) — usado
  // pelo webhook pra saber qual agência/contrato o evento se refere, já
  // que o D4Sign só manda o uuid dele, não o nosso id interno.
  findByContratoProvedorId(provedorId: string): Promise<ContratoPorProvedorId | null>;
  obterDetalhe(id: string): Promise<AgenciaDetalhe | null>;
  create(data: CreateAgenciaData): Promise<Agencia>;
  atualizarStatus(id: string, status: string): Promise<Agencia>;
  salvarSica(id: string, data: { codigo: string; salvoPor: string }): Promise<Agencia>;
  salvarTravelLink(id: string, data: { criado: boolean; salvoPor: string }): Promise<Agencia>;
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
  obterAnaliseContratos(dias: number): Promise<AnaliseContratos>;
}
