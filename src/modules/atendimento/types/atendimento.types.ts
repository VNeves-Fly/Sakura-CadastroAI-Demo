// Tipos do módulo Atendimento — já batem 1:1 com o que a API real devolve
// (ver services/atendimento-api.ts, application/dto e domain/entities do
// backend em src/modules/atendimento/{application,domain}).

export type PapelMembro = "socio" | "representante_legal" | "comercial" | "outro";

export interface MembroAgencia {
  id: string;
  nome: string;
  papel: PapelMembro;
  telefone: string;
}

export type TipoMensagem = "texto" | "audio" | "imagem" | "pdf";
export type AutorMensagem = "cliente" | "analista";

export interface Mensagem {
  id: string;
  conversaId: string;
  autor: AutorMensagem;
  analistaNome?: string;
  tipo: TipoMensagem;
  conteudo: string;
  // Só usado quando tipo === "audio" (duração em segundos).
  duracaoSegundos?: number;
  // Só usado quando tipo !== "texto" (tamanho do arquivo formatado).
  tamanhoArquivo?: string;
  // Presente só quando tipo !== "texto" — monta a URL de mídia:
  // /api/atendimento/midia/{midiaId} (play de áudio, abrir imagem/pdf).
  midiaId?: string;
  lido: boolean;
  createdAt: string; // ISO string no front
}

// Atendimento é sempre da AGÊNCIA (AtendimentoAgencia), não da conversa —
// duas conversas da mesma agência compartilham o mesmo atendimentoAtual/
// historicoAtendimento. Pedido de transferência/assunção pendente não é
// mais parte da Conversa — vive só no store/toast globais
// (useSolicitacoesAtendimentoAgenciaStore), chaveado por agenciaId.
export interface AtendimentoAtual {
  analistaId: string;
  analistaNome: string;
  assumidoEm: string; // ISO string no front
  liberadoEm: string | null;
}

// Resumo da ficha do cliente mostrado na coluna de informações — reflete
// o mesmo tipo de dado já mostrado no dossiê real (/cadastros, /arquivo),
// só que aqui é gerado junto com o resto do mock do atendimento.
export interface DocumentoParaRevisar {
  id: string;
  tipo: string;
  status: "PENDENTE" | "REPROVADO";
  nomeSocio: string | null;
  motivoReprovacao: string | null;
}

export interface ResumoFichaCliente {
  statusAgencia: "ativo" | "recusado" | "em_andamento";
  documentosAprovados: number;
  documentosPendentes: number;
  documentosParaRevisar: DocumentoParaRevisar[];
  situacaoCadastralReceita: string | null;
  contratoStatus: string | null;
  amatSofiaConsultado: boolean;
}

export type TipoContatoConversa = "agencia" | "nao_identificado";

export interface Conversa {
  id: string;
  // null quando tipoContato === "nao_identificado" (número não bate com
  // nenhum sócio/representante/telefone de agência cadastrada).
  agenciaId: string | null;
  tipoContato: TipoContatoConversa;
  agenciaNome: string;
  agenciaCnpj: string;
  membro: MembroAgencia;
  mensagens: Mensagem[];
  atendimentoAtual: AtendimentoAtual | null;
  historicoAtendimento: AtendimentoAtual[];
  resumoFicha: ResumoFichaCliente;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
}

export interface TextoPronto {
  id: string;
  titulo: string;
  conteudo: string;
}

// Categorias oficiais que a Meta exige na submissão de um template
// (WhatsApp Business Message Templates).
export type CategoriaTemplate = "MARKETING" | "UTILITY" | "AUTHENTICATION";

export type StatusTemplate = "aprovado" | "pendente_aprovacao" | "rejeitado";

export interface TemplateAprovado {
  id: string;
  nome: string;
  // Nome amigável definido localmente — nunca mandado pra Meta. Cai pro
  // `nome` técnico quando não definido (ver rótuloTemplate no front).
  titulo: string | null;
  conteudo: string;
  categoria: CategoriaTemplate;
  idioma: string;
  status: StatusTemplate;
  // Liga/desliga o template só do nosso lado — some do picker de envio
  // mesmo que continue aprovado na Meta.
  ativo: boolean;
  // Motivo devolvido pela Meta quando status === "rejeitado" — só existe
  // de verdade depois da revisão deles, nunca inventado aqui.
  motivoRejeicao: string | null;
  criadoEm: string; // ISO string no front
}

export interface AtualizarTemplateMetadataInput {
  titulo?: string | null;
  ativo?: boolean;
}

// Credenciais do Meta for Developers / WhatsApp Business API — campos
// pensados pra bater 1:1 com o painel da Meta (developers.facebook.com),
// pra facilitar quando o back-end for preencher de verdade. Segredos
// (App Secret, Access Token) nunca voltam em texto puro depois de
// salvos — só um booleano "configurado", igual qualquer painel de API
// key de verdade faz; ver SalvarConfiguracaoWhatsappInput pra entrada.
export interface ConfiguracaoWhatsappBusiness {
  appId: string;
  whatsappBusinessAccountId: string;
  phoneNumberId: string;
  numeroTelefoneExibicao: string;
  webhookVerifyToken: string;
  appSecretConfigurado: boolean;
  accessTokenConfigurado: boolean;
  conectado: boolean;
  salvoPor: string | null;
  salvoEm: string | null;
}

export interface SalvarConfiguracaoWhatsappInput {
  appId: string;
  appSecret: string;
  whatsappBusinessAccountId: string;
  phoneNumberId: string;
  numeroTelefoneExibicao: string;
  accessToken: string;
  webhookVerifyToken: string;
  salvoPor: string;
}

// ---- Inputs (equivalentes aos DTOs do back-end) ----

export interface EnviarMensagemInput {
  tipo: TipoMensagem;
  conteudo: string;
  duracaoSegundos?: number;
  tamanhoArquivo?: string;
  // Presentes só quando o envio veio de um template com variáveis
  // preenchidas (ver PreencherVariaveisModal em thread-conversa.tsx).
  templateId?: string;
  variaveis?: string[];
}

export interface CriarTextoProntoInput {
  titulo: string;
  conteudo: string;
}

export interface CriarTemplateInput {
  nome: string;
  conteudo: string;
  categoria: CategoriaTemplate;
  idioma: string;
}

export interface AtualizarTextoProntoInput {
  titulo: string;
  conteudo: string;
}

// Espelha DocumentoPendenteView/DocumentosPendentesOutput do módulo
// cadastro (listar-documentos-pendentes.use-case.ts) — reaproveitado
// aqui pro picker de "vincular mídia do chat como documento".
export interface DocumentoPendenteView {
  id: string;
  tipo: string;
  nomeSocio: string | null;
  motivoReprovacao: string | null;
}

export interface DocumentosPendentesOutput {
  razaoSocial: string;
  documentosPendentes: DocumentoPendenteView[];
}

export interface VincularMidiaComoDocumentoInput {
  agenciaId: string;
  documentoId: string;
}

// Aba "Contatos" — todas as agências cadastradas (não só as com conversa
// já iniciada), com os números de WhatsApp candidatos de cada uma
// (Comercial + sócios). `conversaId` null = número nunca trocou mensagem;
// nesse caso iniciarConversa cria a Conversa na hora que o analista escolhe.
export interface NumeroContato {
  label: string;
  telefone: string;
  papel: PapelMembro;
  representanteLegalId: string | null;
  agenciaId: string;
  conversaId: string | null;
}

export interface ContatoAgencia {
  agenciaId: string;
  agenciaNome: string;
  cnpj: string;
  numeros: NumeroContato[];
}

export interface IniciarConversaInput {
  agenciaId: string;
  telefoneWhatsapp: string;
  representanteLegalId: string | null;
  membroNome: string | null;
  membroPapel: PapelMembro;
}

export interface ResultadoTesteConexao {
  sucesso: boolean;
  mensagem: string;
}
