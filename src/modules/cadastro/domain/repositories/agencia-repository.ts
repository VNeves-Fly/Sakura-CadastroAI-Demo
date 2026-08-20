import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type { OrigemGeracaoContrato, ResultadoAnaliseIa } from "@/modules/cadastro/domain/enums";
import type { DocumentAnalysisResultado } from "@/modules/cadastro/domain/services/document-analysis-service";
import type {
  AnaliseIaResultado,
  AnaliseIaDetalhamento,
  AnaliseIaRawData,
  AnaliseIaStage1,
  AnaliseIaStage2,
} from "@/modules/cadastro/domain/services/analise-ia-service";
import type {
  SicaConsultaResultado,
  SicaEmpresaStatus,
} from "@/modules/cadastro/domain/services/sst-service";

export type { OrigemGeracaoContrato, ResultadoAnaliseIa };

// Única fonte de crédito reconsultável isoladamente pelo analista (ver
// ReconsultarCreditoUseCase) — as duas seções do stage2 que têm card
// próprio no dossiê (ConsultaAmatCard/ConsultaSofiaCard). Processos
// judiciais/reclamações não têm botão de reconsulta hoje.
export type FonteConsultaCredito = "AMAT" | "SOFIA";

// Uma linha de auditoria por clique em "Reconsultar" — quem consultou e
// quando (ver HistoricoConsultaCredito no schema). `resultado`/
// `rawResultado` não entram aqui: a lista serve só pra render do
// histórico (quem/quando/sucesso), o snapshot completo fica só no banco.
export interface HistoricoConsultaCreditoItem {
  id: string;
  fonte: FonteConsultaCredito;
  sucesso: boolean;
  erro: string | null;
  consultadoPor: string;
  createdAt: Date;
}

// Uma linha por consulta ao SST (ver ConsultaSst no schema) — a mais
// recente é "o valor atual" (não há sobrescrita, ver comentário do
// modelo). `consultadoPor: null` = disparada automaticamente pelo
// pipeline (AnalisarCadastroUseCase); preenchido = analista (reconsulta
// manual ou confirmação do código SICA, ver SalvarSicaUseCase).
export interface ConsultaSstItem {
  id: string;
  sucesso: boolean;
  erro: string | null;
  metodo: "cnpj" | "codigo_empresa";
  encontrado: boolean;
  codigoEmpresa: number | null;
  nomeEmpresa: string | null;
  telefone: string | null;
  email: string | null;
  empresaStatus: SicaEmpresaStatus | null;
  codigoExecutivo: number | null;
  nomeExecutivo: string | null;
  consultadoPor: string | null;
  createdAt: Date;
}

// Uma linha por transição de Agencia.status (ver HistoricoEtapaCadastro no
// schema) — histórico completo do funil, pra medir SLA (tempo em cada
// etapa) e auditar quem/o que causou cada mudança. `statusAnterior: null`
// é o registro inicial (criação do cadastro, sem etapa anterior).
// `agenciaId`/`agenciaNome` só importam pra listagem global (ver
// listarUltimasMovimentacoesEtapa, usada no dashboard) — redundantes num
// eventual uso escopado a uma agência só, mas inofensivos.
export interface HistoricoEtapaCadastroItem {
  id: string;
  agenciaId: string;
  agenciaNome: string;
  statusAnterior: string | null;
  statusNovo: string | null;
  usuarioEmail: string | null;
  origem: string | null;
  observacao: string | null;
  desbloqueioManual: boolean | null;
  detalhes: string | null;
  createdAt: Date;
}

// Tempo médio (em dias) que os cadastros passam numa etapa antes de saírem
// dela, calculado a partir de HistoricoEtapaCadastro (ver
// calcularSlaPorEtapa) — só considera trajetos concluídos (a etapa atual
// de um cadastro que ainda não avançou não entra na média). `amostras: 0`
// quando a etapa nunca foi concluída por nenhum cadastro ainda.
export interface SlaEtapaItem {
  status: string;
  mediaDias: number | null;
  amostras: number;
}

export type Granularidade = "dia" | "mes" | "ano";

export interface SeriePeriodoItem {
  periodo: string;
  quantidade: number;
}

// Contagem de HistoricoEtapaCadastro por período, nas 3 granularidades de
// uma vez (ver listarSeriesMovimentacoes) — alimenta o seletor DIA/MÊS/ANO
// dos cards de KPI do dashboard. Períodos sem nenhuma linha entram com
// `quantidade: 0` (nunca ficam faltando, pra não quebrar o gráfico).
export interface SeriesMovimentacao {
  dia: SeriePeriodoItem[];
  mes: SeriePeriodoItem[];
  ano: SeriePeriodoItem[];
}

// `apenasCriacao` conta o registro inicial de cada cadastro (statusAnterior
// nulo — ver create() em PrismaAgenciaRepository); `statusNovo`/`origem`
// contam quem ENTROU numa etapa específica (opcionalmente só por uma
// origem — ex.: statusNovo=aguardando_assinatura + origem=ia é exatamente
// "contrato gerado automaticamente pela IA", já que registrarAnaliseFinal
// só grava origem "ia" nesse caminho).
export interface FiltroSerieMovimentacao {
  apenasCriacao?: boolean;
  statusNovo?: string;
  origem?: string;
}

// Quem/o que causou uma transição de status, gravado junto em
// HistoricoEtapaCadastro por atualizarStatus/registrarAnaliseFinal/create.
// `origem` é texto livre por convenção: "usuario" (ação do analista no
// painel), "ia" (AnalisarCadastroUseCase), ou "sistema - <agente>" quando
// não há nem analista nem IA envolvidos (ex.: "sistema - d4sign" pro
// webhook do D4Sign, "sistema - formulario" pra criação do cadastro) —
// nesses casos `usuarioEmail` fica null, a menos que o próprio evento
// externo identifique alguém (ex.: e-mail do signatário no webhook).
export interface ContextoMudancaStatus {
  usuarioEmail: string | null;
  origem: string;
  observacao?: string | null;
  desbloqueioManual?: boolean;
}

// Ciclo de vida completo da agência (decisão do usuário, 2026-07-16;
// "em_analise" adicionado em 2026-07-24 quando o envio do cadastro passou
// a persistir antes da IA rodar — ver AnalisarCadastroUseCase;
// "aguardando_cadastramento" adicionado em 2026-07-30 pra separar a
// validação das evidências de assinatura do cadastramento em SICA/TravelLink,
// que antes viviam juntos em "aguardando_validacao" — ver
// ProcessarWebhookD4SignUseCase):
// 0. em_analise               — persistido, aguardando a análise de IA rodar em background.
// 1. em_complementar          — IA reprovou (ou a análise falhou tecnicamente), sem contrato ainda, analista revisa manualmente.
// 2. aguardando_assinatura    — contrato gerado (pela IA ou pelo analista) e enviado, aguardando TODOS os sócios assinarem.
// 3. aguardando_validacao     — todos os sócios assinaram; analista precisa validar as evidências de assinatura (selfie/documento/vídeo).
// 4. aguardando_cadastramento — validado; falta cadastrar a agência no SICA e no TravelLink.
// 5. aguardando_ativacao      — SICA/TravelLink cadastrados; falta só o Usuário Master e clicar em ativar.
// 6. ativo / recusado         — estados finais.
export const STATUS_EM_ANALISE = "em_analise";
export const STATUS_EM_COMPLEMENTAR = "em_complementar";
export const STATUS_AGUARDANDO_ASSINATURA = "aguardando_assinatura";
export const STATUS_AGUARDANDO_VALIDACAO = "aguardando_validacao";
export const STATUS_AGUARDANDO_CADASTRAMENTO = "aguardando_cadastramento";
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
// Cancelado pelo analista (CancelarContratoUseCase) — a Agencia volta pra
// em_complementar; este registro fica só como histórico.
export const CONTRATO_STATUS_CANCELADO = "cancelado";

// Sentinela reconhecível (nunca um uuid real do D4Sign) — usado quando o
// analista aprova sem gerar contrato automaticamente (checkbox no modal de
// Aprovar Complementar, ver AprovarCadastroComplementarUseCase) pra
// sinalizar na UI (ContratoIdManual, via origemGeracao "externo") que
// falta colar o ID de um documento de verdade.
export const CONTRATO_PROVEDOR_ID_PENDENTE = "pendente";

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
  nomeFantasia: string | null;
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

// Tamanho de página default da listagem de cadastros, usado quando
// `tamanhoPagina` não vem na querystring (ou vem um valor fora de
// TAMANHOS_PAGINA_CADASTROS_PERMITIDOS) — ver PrismaAgenciaRepository.listar.
export const TAMANHO_PAGINA_CADASTROS = 20;

// Opções do seletor "itens por página" na tabela de /cadastros — qualquer
// outro valor recebido pela querystring é ignorado, cai no default acima.
export const TAMANHOS_PAGINA_CADASTROS_PERMITIDOS = [10, 20, 50, 100] as const;

export interface ListarCadastrosFiltros {
  busca?: string;
  status?: string | string[];
  sortBy?: "razaoSocial" | "createdAt";
  sortDir?: "asc" | "desc";
  executivoId?: string | string[];
  associacaoId?: string | string[];
  eventoId?: string | string[];
  // Base/gestor do executivo (PromotorBase.baseId -> Base.sigla/Promotor.gestorId) —
  // filtrado via relação com Agencia.executivo. gestorId é o id real do
  // model Gestor (2026-08-03); base agora é FK real pra Base (2026-08-04) —
  // substitui o antigo filtro por string livre.
  base?: string | string[];
  gestorId?: string | string[];
  // Id do analista logado, quando o switch "Meus atendimentos" está
  // ativo — filtra pelas agências onde esse analista é o atendente ATIVO
  // no momento (AtendimentoAgencia.liberadoEm null), via
  // Agencia.atendimentosAgencia.
  atendenteAtivoId?: string;
  // "Com" (true) / "sem" (false) / todos (undefined) — ver
  // Agencia.infoPendente no schema.
  infoPendente?: boolean;
  // 1-based — já validada/normalizada (inteiro >= 1) por quem chama (a
  // page, que é a fronteira real de confiança pra esse parâmetro vindo da
  // querystring).
  pagina?: number;
  // Sobrescreve TAMANHO_PAGINA_CADASTROS — já validada por quem chama
  // (deve ser um de TAMANHOS_PAGINA_CADASTROS_PERMITIDOS).
  tamanhoPagina?: number;
  // Ignora pagina/tamanhoPagina e devolve todos os registros que casam com
  // o filtro — usado só pela exportação (CSV de /cadastros/exportar), que
  // precisa do recorte completo, não da página visível na tela.
  todos?: boolean;
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
  // Sempre null (decisão do usuário, 2026-07-28): cada agência pertence a
  // UMA base só, mas isso nunca foi capturado no cadastro — o executivo
  // atribuído pode atender várias bases (PromotorBase), então mostrar
  // "todas as bases do executivo" como se fosse "a base da agência" é
  // ambíguo/errado. Mantido no tipo (em vez de removido) até existir uma
  // fonte real de base por agência.
  executivoBase: null;
  executivoGestor: string | null;
  // Consulta mais recente ao SST (qualquer método) — badge da coluna SICA
  // em /cadastros. null = nunca consultado (ou toda tentativa falhou).
  consultaSicaMaisRecente: ConsultaSstItem | null;
  // Ver temAtualizacaoPendente (agencia.entity.ts) — mensagem de cliente
  // ou documento reenviado desde a última vez que quem atendia viu a
  // ficha.
  temAtualizacaoPendente: boolean;
}

export interface ListarCadastrosResult {
  items: ListarCadastrosItem[];
  total: number;
}

export interface CadastrosKpis {
  emAnalise: number;
  emComplementar: number;
  aguardandoAssinatura: number;
  // Breakdown do card "Aguardando assinatura" por origem do contrato
  // (contrato gerado pela IA x pelo analista), usado só no hover do card
  // — o próprio card não muda de cor/valor por causa disso.
  aguardandoAssinaturaPorOrigem: { ia: number; humano: number };
  aguardandoValidacao: number;
  aguardandoCadastramento: number;
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
  id: string;
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
  razoes: string[];
  detalhamento: AnaliseIaDetalhamento | null;
  // Verificação cadastral (situação, CNAE, comparação fornecido x oficial
  // de razão social/nome fantasia/e-mail/sócios) — ver VerificacaoCadastral
  // no dossiê. null em cadastros analisados antes desta funcionalidade
  // existir, ou quando o agente não executou o stage1.
  stage1: AnaliseIaStage1 | null;
  // AMAT/SOFIA (ver ConsultaAmatCard/ConsultaSofiaCard) — null em
  // cadastros analisados antes desta funcionalidade existir, ou quando o
  // agente não executou o stage2/não trouxe raw_data.
  stage2: AnaliseIaStage2 | null;
  rawData: AnaliseIaRawData | null;
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
  // Auditoria das reconsultas manuais de AMAT/SOFIA, mais recente primeiro.
  historicoConsultaCredito: HistoricoConsultaCreditoItem[];
  // Consultas ao SST (SICA), mais recente primeiro — a primeira com
  // sucesso=true é "o valor atual" (ver ConsultarSicaUseCase/SalvarSicaUseCase).
  consultasSst: ConsultaSstItem[];
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
  // `statusAtual` é o status ANTES dessa chamada (o caller já tem esse
  // valor de obterDetalhe) — grava a linha de HistoricoEtapaCadastro com o
  // par real de/para, sem assumir que "em_complementar" foi visitado (a IA
  // pode aprovar direto de em_analise pra aguardando_assinatura).
  registrarAnaliseFinal(
    agenciaId: string,
    avaliacao: AnaliseIaResultado,
    statusAtual: string,
    novoStatus: string,
    resultado: ResultadoAnaliseIa,
  ): Promise<void>;
  // `contexto` é obrigatório de propósito — força todo chamador a decidir
  // quem/o que causou a transição (ver ContextoMudancaStatus) em vez de
  // deixar a origem em branco.
  atualizarStatus(id: string, status: string, contexto: ContextoMudancaStatus): Promise<Agencia>;
  // Métricas do dashboard (ver ObterMetricasDashboardUseCase) — contagem de
  // cadastros criados desde uma data (ex.: últimos 30 dias).
  contarNovosCadastros(desde: Date): Promise<number>;
  // Média de dias por etapa, calculada a partir de todo o histórico de
  // transições (ver SlaEtapaItem e ObterMetricasDashboardUseCase).
  calcularSlaPorEtapa(): Promise<SlaEtapaItem[]>;
  // Feed global (todas as agências) das últimas transições de etapa, mais
  // recente primeiro — usado na lista "Últimas movimentações" do dashboard.
  listarUltimasMovimentacoesEtapa(limite: number): Promise<HistoricoEtapaCadastroItem[]>;
  // Série pro seletor DIA/MÊS/ANO dos cards de KPI (ver
  // FiltroSerieMovimentacao/SeriesMovimentacao) — uma chamada por métrica,
  // já devolve as 3 granularidades juntas.
  listarSeriesMovimentacoes(filtro: FiltroSerieMovimentacao): Promise<SeriesMovimentacao>;
  // Grava uma linha de auditoria da reconsulta (quem/quando/sucesso) e,
  // só quando `sucesso`, sobrescreve o stage2/rawData "atuais" da
  // AnaliseIaAgencia (ver ReconsultarCreditoUseCase) — nunca toca em
  // Agencia.status, parecer, motivo ou flagsRisco (diferente de
  // registrarAnaliseFinal, que é o veredito do pipeline completo).
  registrarConsultaCredito(
    agenciaId: string,
    data: {
      fonte: FonteConsultaCredito;
      sucesso: boolean;
      erro: string | null;
      stage2: AnaliseIaStage2 | null;
      rawData: AnaliseIaRawData | null;
      consultadoPor: string;
    },
  ): Promise<void>;
  // Grava uma linha de auditoria da consulta ao SST (quem/quando/sucesso +
  // o que foi encontrado) — nunca sobrescreve a linha anterior (ver
  // ConsultaSst no schema). `resultado: null` só quando `sucesso: false`.
  registrarConsultaSst(
    agenciaId: string,
    data: {
      sucesso: boolean;
      erro: string | null;
      metodo: "cnpj" | "codigo_empresa";
      resultado: SicaConsultaResultado | null;
      consultadoPor: string | null;
    },
  ): Promise<void>;
  // Edição em lote pelo analista (ver EditarDadosEmpresaUseCase) — nunca
  // inclui campos sourced de DadosReceita, que não é tocado por este
  // método.
  atualizarDadosCadastrais(
    id: string,
    data: {
      razaoSocial?: string;
      nomeFantasia?: string | null;
      emailContato?: string;
      telefoneContato?: string;
    },
  ): Promise<Agencia>;
  salvarSica(id: string, data: { codigo: string; salvoPor: string }): Promise<Agencia>;
  salvarTravelLink(id: string, data: { criado: boolean; salvoPor: string }): Promise<Agencia>;
  // Devolve o id do Contrato criado — precisa pra gravar ContratoAssinatura
  // (keySigner capturado na hora da geração, ver AprovarCadastroComplementarUseCase/
  // AnalisarCadastroUseCase) logo em seguida.
  criarContrato(
    agenciaId: string,
    data: {
      provedorId: string;
      status: string;
      origemGeracao: OrigemGeracaoContrato;
      signatarios: ContratoSignatarioData[];
    },
  ): Promise<{ id: string }>;
  // Mesma coisa que criarContrato + atualizarStatus em sequência, só que
  // numa transação só — evita ficar com o Contrato criado e a Agencia sem
  // avançar se a segunda escrita falhar depois da primeira (incidente real,
  // ver AprovarCadastroComplementarUseCase).
  criarContratoEAvancarStatus(
    agenciaId: string,
    dadosContrato: {
      provedorId: string;
      status: string;
      origemGeracao: OrigemGeracaoContrato;
      signatarios: ContratoSignatarioData[];
    },
    novoStatus: string,
    contexto: ContextoMudancaStatus,
  ): Promise<{ contratoId: string; agencia: Agencia }>;
  atualizarStatusContrato(contratoId: string, status: string): Promise<void>;
  // Só quem estava EM ATENDIMENTO chama isto (ver comentário no
  // schema.prisma) — simplesmente abrir o dossiê sem estar atendendo não
  // deve chamar este método.
  marcarAtualizacaoComoVista(agenciaId: string, analistaId: string): Promise<void>;
  // Liga "info pendente" (ver comentário no schema.prisma) — chamado só
  // por SolicitarReenvioDocumentosUseCase. Desligar automático não tem
  // método próprio: acontece sozinho em atualizarStatus (qualquer
  // transição) e em PrismaNotificacaoRepository.create (qualquer
  // notificação da agência). Desligar manual é desmarcarInfoPendente,
  // abaixo.
  marcarInfoPendente(agenciaId: string): Promise<void>;
  // Remoção manual pelo analista (dossiê) — grava quem/quando pra deixar
  // rastro (ver infoPendenteRemovidoPor/Em no schema.prisma), diferente
  // dos desligamentos automáticos acima, que não tocam esses dois campos.
  desmarcarInfoPendente(agenciaId: string, analistaId: string): Promise<void>;
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
