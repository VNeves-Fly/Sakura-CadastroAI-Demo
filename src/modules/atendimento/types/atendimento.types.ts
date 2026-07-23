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

export interface AssumirAtendimentoRegistro {
  analistaNome: string;
  assumidoEm: string; // ISO string no front
  liberadoEm: string | null;
}

export type StatusSolicitacaoTransferencia = "pendente" | "aceita" | "recusada" | "expirada";

// Transferência de atendimento entre analistas — pedido explícito (não
// depende da regra de 2h de inatividade, que é só pra "puxar" de quem
// sumiu). Expira sozinha em 60s sem resposta (ver
// TIMEOUT_TRANSFERENCIA_MS em atendimento-api.ts), contada como recusa.
export interface SolicitacaoTransferencia {
  id: string;
  conversaId: string;
  deAnalista: string;
  paraAnalista: string;
  status: StatusSolicitacaoTransferencia;
  criadaEm: string; // ISO string no front
}

// Resumo da ficha do cliente mostrado na coluna de informações — reflete
// o mesmo tipo de dado já mostrado no dossiê real (/painel, /arquivo),
// só que aqui é gerado junto com o resto do mock do atendimento.
export interface ResumoFichaCliente {
  statusAgencia: "ativo" | "recusado" | "em_andamento";
  documentosAprovados: number;
  documentosPendentes: number;
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
  atendimentoAtual: AssumirAtendimentoRegistro | null;
  historicoAtendimento: AssumirAtendimentoRegistro[];
  // Só existe uma pendente por vez por conversa — pedir uma nova
  // enquanto existe outra pendente não é permitido (ver
  // solicitarTransferencia em atendimento-api.ts).
  solicitacaoTransferenciaPendente: SolicitacaoTransferencia | null;
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
  conteudo: string;
  categoria: CategoriaTemplate;
  idioma: string;
  status: StatusTemplate;
  // Motivo devolvido pela Meta quando status === "rejeitado" — só existe
  // de verdade depois da revisão deles, nunca inventado aqui.
  motivoRejeicao: string | null;
  criadoEm: string; // ISO string no front
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
}

export interface AssumirAtendimentoInput {
  analistaNome: string;
}

export interface CriarTextoProntoInput {
  titulo: string;
  conteudo: string;
}

export interface SolicitarTransferenciaInput {
  deAnalista: string;
  paraAnalista: string;
}

export interface ResponderTransferenciaInput {
  aceita: boolean;
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

export interface ResultadoTesteConexao {
  sucesso: boolean;
  mensagem: string;
}
