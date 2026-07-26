import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type { OrigemGeracaoContrato, ResultadoAnaliseIa } from "@/modules/cadastro/domain/enums";
import type { DocumentAnalysisResultado } from "@/modules/cadastro/domain/services/document-analysis-service";
import type {
  AnaliseIaResultado,
  AnaliseIaDetalhamento,
} from "@/modules/cadastro/domain/services/analise-ia-service";

export type { OrigemGeracaoContrato, ResultadoAnaliseIa };

// Ciclo de vida completo da agência (decisão do usuário, 2026-07-16;
// "em_analise" adicionado em 2026-07-24 quando o envio do cadastro passou
// a persistir antes da IA rodar — ver AnalisarCadastroUseCase):
// 0. em_analise             — persistido, aguardando a análise de IA rodar em background.
// 1. em_complementar        — IA reprovou (ou a análise falhou tecnicamente), sem contrato ainda, analista revisa manualmente.
// 2. aguardando_assinatura  — contrato gerado (pela IA ou pelo analista) e enviado, aguardando os sócios assinarem.
// 3. aguardando_validacao   — contrato assinado, analista precisa validar o contrato assinado.
// 4. aguardando_ativacao    — validado; falta só SICA/Travel Link/Usuário Master (não implementados) e clicar em ativar.
// 5. ativo / recusado       — estados finais.
export const STATUS_EM_ANALISE = "em_analise";
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
  // Snapshot imutável do signatário no momento em que o contrato foi
  // gerado (ver comentário de ContratoSignatario no schema Prisma) — se
  // faltar (representanteLegal sem esse dado), a cláusula do contrato
  // simplesmente omite o segmento correspondente (ver
  // formatarClausulaSocio).
  rgNumero: string | null;
  rgOrgaoEmissor: string | null;
  nacionalidade: string | null;
  estadoCivil: string | null;
  dataNascimento: Date | null;
  endereco: EnderecoData;
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
  rgNumero: string;
  rgOrgaoEmissor: string;
  nacionalidade: string;
  administrativo: boolean | null;
  endereco: EnderecoData;
  isRepresentanteLegal: boolean;
  rgPath: string;
  // Bucket onde rgPath/procuracaoPath foram salvos (ver SavedFile) — vai
  // pro Documento.gcsBucket, pra sempre saber em qual bucket o arquivo
  // está de verdade mesmo que GCS_BUCKET_NAME mude depois do upload.
  rgBucket: string | null;
  procuracaoPath: string | null;
  procuracaoBucket: string | null;
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
  bancoCodigo: string;
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
  // Id real do Promotor atribuído (Agencia.executivoId) — já resolvido
  // pelo ExecutivoResolver antes de chegar aqui (a partir do link pessoal
  // do promotor ou de um link de Evento), null se nenhum executivo foi
  // atribuído. Nome/gestor/base continuam resolvidos só na leitura (ver
  // atribuicoesAdminController) — este módulo não conhece o domínio de
  // Promotor além do id.
  executivoId: string | null;
  // Id da Associacao atribuída (combobox do form público ou link de
  // Evento) — null se nenhuma foi atribuída.
  associacaoId: string | null;
  // Id do Evento (cadastros /eventos) de onde veio o link usado, se houver.
  eventoId: string | null;
  // Gravado atomicamente junto (Agencia + sócios + CadastroComplementar),
  // numa transação — não existe intervalo entre eles. Status inicial é
  // sempre STATUS_EM_ANALISE: a análise de IA e o contrato (se aprovado)
  // são gravados depois, de forma assíncrona, via registrarAnaliseDocumento/
  // registrarAnaliseFinal/criarContrato (ver AnalisarCadastroUseCase).
  empresa: EmpresaData;
  socios: SocioData[];
  enderecoBanco: EnderecoBancoData;
}

export interface ListarCadastrosFiltros {
  busca?: string;
  status?: string | string[];
  sortBy?: "razaoSocial" | "createdAt";
  sortDir?: "asc" | "desc";
  executivoId?: string;
  associacaoId?: string;
  eventoId?: string;
}

export interface ListarCadastrosItem {
  agencia: Agencia;
  // Origem do contrato mais recente (se houver) — usado só pra dar
  // contexto na listagem (ex.: tooltip "gerado pela IA" vs "gerado pelo
  // analista" na fila Aguardando Assinatura).
  origemContratoAtual: OrigemGeracaoContrato | null;
  // Nome da associação (Agencia.associacaoId), já resolvido — null se a
  // agência não pertence a nenhuma.
  associacaoNome: string | null;
  // Nome do executivo atribuído (Agencia.executivoId) e do evento de
  // origem (Agencia.eventoId), já resolvidos — mesma lógica de
  // associacaoNome. Null quando não há atribuição.
  executivoNome: string | null;
  eventoNome: string | null;
}

export interface ListarCadastrosResult {
  items: ListarCadastrosItem[];
  total: number;
}

export interface CadastrosKpis {
  emAnalise: number;
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
  // Dado digitado (não o arquivo) — null só pra sócios anteriores a este
  // campo passar a ser coletado pelo wizard.
  rgNumero: string | null;
  rgOrgaoEmissor: string | null;
  nacionalidade: string | null;
  dataNascimento: Date | null;
  // Sócio administrador/quem assina o contrato (ver comentário no schema
  // Prisma) — null/true assina, false exclui da lista de signatarios.
  administrativo: boolean | null;
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
  bancoCodigo: string | null;
  bancoAgencia: string | null;
  bancoConta: string | null;
  bancoSwift: string | null;
  tipoConta: string | null;
  favorecidoEhEmpresa: boolean | null;
  favorecidoNome: string | null;
  favorecidoDoc: string | null;
}

// Veredito (ou estado atual) gravado por
// AnalisarCadastroUseCase.registrarAnaliseFinal — `resultado` classifica
// POR QUE a agência chegou no status atual (REPROVADO real vs
// FALHA_ANALISE/FALHA_CONTRATO técnicas vs EM_ANALISE, ainda pendente),
// `motivo`/`parecer`/`flagsRisco`/`detalhamento` dão o contexto legível
// pro analista (detalhamento é o cruzamento documental do stage3, usado
// pra montar o checklist "o que checar" no dossiê). null só em cadastros
// anteriores a esta funcionalidade existir.
export interface AnaliseIaAgenciaDetalhe {
  resultado: ResultadoAnaliseIa;
  parecer: string | null;
  motivo: string | null;
  flagsRisco: string[];
  detalhamento: AnaliseIaDetalhamento | null;
  avaliadoEm: Date;
}

export interface AgenciaDetalhe {
  agencia: Agencia;
  complementar: CadastroComplementarDetalhe | null;
  representantesLegais: RepresentanteLegalDetalhe[];
  // Documento do contrato social — mesma lógica de "mais recente por
  // slot" dos documentos de sócio (ver RepresentanteLegalDetalhe).
  contratoSocial: Documento | null;
  contratos: ContratoDetalhe[];
  // null = agência anterior a essa avaliação existir.
  analiseIa: AnaliseIaAgenciaDetalhe | null;
  // Origem da agência, já resolvida — mesma lógica de ListarCadastrosItem
  // (ver comentário lá), exposta aqui pro dossiê mostrar as 3 badges.
  executivoNome: string | null;
  associacaoNome: string | null;
  eventoNome: string | null;
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
  // Grava (ou regrava, em caso de reprocessamento) o resultado do
  // documentAnalysisService.analisar() pro documento já existente — parte
  // do fluxo assíncrono pós-persistência (ver AnalisarCadastroUseCase).
  registrarAnaliseDocumento(
    documentoId: string,
    resultado: DocumentAnalysisResultado,
  ): Promise<void>;
  // Grava (ou regrava) o veredito final do analiseIaService.avaliar() e
  // move a Agencia pro status resultante (aguardando_assinatura ou
  // em_complementar) numa única operação — reaproveitado tanto pelo
  // fluxo automático quanto pelo reprocessamento manual no admin.
  // `resultado` classifica POR QUE chegou nesse status (ver
  // ResultadoAnaliseIa) — distingue reprovação real de falha técnica.
  registrarAnaliseFinal(
    agenciaId: string,
    avaliacao: AnaliseIaResultado,
    novoStatus: string,
    resultado: ResultadoAnaliseIa,
  ): Promise<void>;
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
  // Agências atribuídas a um promotor (Agencia.executivoId = id do
  // Promotor) — usado pela ficha de colaborador em Atribuições, não pelo
  // dossiê em si.
  listarPorExecutivoId(promotorId: string): Promise<AgenciaResumoPromotor[]>;
}

export interface AgenciaResumoPromotor {
  id: string;
  razaoSocial: string;
  cnpj: string;
  status: string;
  createdAt: Date;
}
