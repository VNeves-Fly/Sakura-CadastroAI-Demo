import type {
  Conversa,
  Mensagem,
  TextoPronto,
  TemplateAprovado,
  ConfiguracaoWhatsappBusiness,
  EnviarMensagemInput,
  CriarTextoProntoInput,
  AtualizarTextoProntoInput,
  CriarTemplateInput,
  AtualizarTemplateMetadataInput,
  SalvarConfiguracaoWhatsappInput,
  ResultadoTesteConexao,
  DocumentosPendentesOutput,
  VincularMidiaComoDocumentoInput,
  ContatoAgencia,
  IniciarConversaInput,
} from "@/modules/atendimento/types/atendimento.types";
import { gerarConfiguracaoWhatsappMock } from "@/modules/atendimento/mock/atendimento-mock.data";

// Chamadas reais pra /api/atendimento/*. Só salvarConfiguracaoWhatsapp
// continua sobre um "banco" em memória — decisão de produto (2026-07-23):
// .env segue sendo a fonte da verdade das credenciais da Meta, a tela de
// configuração serve só pra visualizar (obterConfiguracaoWhatsapp, real)
// e testar conexão (testarConexaoWhatsapp, real); "salvar" via UI fica
// fora de escopo por enquanto. Ações de atendimento (Iniciar/Encerrar/
// Transferir/Assumir) não vivem mais aqui — são todas via
// atendimentoAgenciaApi (services/atendimento-agencia-api.ts), chaveadas
// por agenciaId, compartilhadas com o dossiê/listagem de cadastros.

let configuracaoWhatsapp = gerarConfiguracaoWhatsappMock();

function atraso(ms = 150): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T;
}

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const corpo = await response.json().catch(() => null);
    throw new Error(corpo?.error ?? `Erro ${response.status} ao chamar ${input}.`);
  }

  return response.json() as Promise<T>;
}

export const atendimentoApi = {
  async listarConversas(): Promise<Conversa[]> {
    return fetchJson<Conversa[]>("/api/atendimento/conversas");
  },

  // Contagem agregada (não a lista inteira) — alimenta o badge do sidebar.
  async contarNaoLidas(): Promise<{ total: number }> {
    return fetchJson<{ total: number }>("/api/atendimento/nao-lidas");
  },

  // Aba "Contatos" — todas as agências, tenham conversa iniciada ou não.
  async listarContatos(busca?: string): Promise<ContatoAgencia[]> {
    const query = busca ? `?busca=${encodeURIComponent(busca)}` : "";
    return fetchJson<ContatoAgencia[]>(`/api/atendimento/contatos${query}`);
  },

  // Modal "com quem você quer falar" ao chegar de /atendimento?agenciaId=X.
  async obterContatoAgencia(agenciaId: string): Promise<ContatoAgencia> {
    return fetchJson<ContatoAgencia>(`/api/atendimento/contatos/${agenciaId}`);
  },

  // Cria a Conversa (ou devolve a já existente, idempotente) pra um
  // número que o analista escolheu na lista de Contatos/modal.
  async iniciarConversa(input: IniciarConversaInput): Promise<Conversa> {
    return fetchJson<Conversa>("/api/atendimento/conversas/iniciar", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  // Só os aprovados — é o que pode ser usado de verdade pra iniciar
  // conversa fora da janela de 24h (ver TemplatesAprovadosPicker/
  // TemplatesDropdownButton no /atendimento).
  async listarTemplatesAprovados(): Promise<TemplateAprovado[]> {
    return fetchJson<TemplateAprovado[]>("/api/atendimento/templates");
  },

  // Todos, independente do status — usado na tela de configuração
  // (Messenger), pra o analista acompanhar o que está pendente/rejeitado
  // pela Meta.
  async listarTemplates(): Promise<TemplateAprovado[]> {
    return fetchJson<TemplateAprovado[]>("/api/atendimento/templates/todos");
  },

  // Submete o template de verdade pra aprovação da Meta (Business
  // Management API) — nunca simula um "aprovado" instantâneo, o status
  // inicial é sempre o que a Meta devolver (pendente, na prática).
  async criarTemplate(input: CriarTemplateInput): Promise<TemplateAprovado> {
    return fetchJson<TemplateAprovado>("/api/atendimento/templates", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  // Reenviar um template rejeitado — edita o conteúdo na Meta de verdade
  // (POST /{template-id}), que reseta o status pra pendente de revisão.
  async reenviarTemplate(id: string, novoConteudo: string): Promise<TemplateAprovado> {
    return fetchJson<TemplateAprovado>(`/api/atendimento/templates/${id}/reenviar`, {
      method: "POST",
      body: JSON.stringify({ novoConteudo }),
    });
  },

  // Título/ativo são só nossos — nunca sincronizados com a Meta (PATCH
  // dedicado, separado do reenvio que edita conteúdo lá).
  async atualizarTemplateMetadata(
    id: string,
    input: AtualizarTemplateMetadataInput,
  ): Promise<TemplateAprovado> {
    return fetchJson<TemplateAprovado>(`/api/atendimento/templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  // Puxa da Meta o status real (aprovado/pendente/rejeitado + motivo) de
  // todos os templates e atualiza o cache local — a Meta não avisa a
  // gente quando revisa um template, então isso precisa ser acionado
  // manualmente (botão "Sincronizar" na tela Messenger).
  async sincronizarTemplates(): Promise<{ sincronizados: number }> {
    return fetchJson<{ sincronizados: number }>("/api/atendimento/templates/sincronizar", {
      method: "POST",
    });
  },

  // .env é a fonte da verdade das credenciais (decisão de produto
  // 2026-07-23) — isso só reflete o que já está configurado no ambiente,
  // nunca re-expõe segredo em texto puro.
  async obterConfiguracaoWhatsapp(): Promise<ConfiguracaoWhatsappBusiness> {
    return fetchJson<ConfiguracaoWhatsappBusiness>("/api/atendimento/messenger/configuracao");
  },

  // Chamada real de teste na Graph API (GET no próprio número) — confirma
  // que as credenciais do .env realmente falam com a Meta.
  async testarConexaoWhatsapp(): Promise<ResultadoTesteConexao> {
    return fetchJson<ResultadoTesteConexao>("/api/atendimento/messenger/testar-conexao", {
      method: "POST",
    });
  },

  async salvarConfiguracaoWhatsapp(
    input: SalvarConfiguracaoWhatsappInput,
  ): Promise<ConfiguracaoWhatsappBusiness> {
    await atraso();
    configuracaoWhatsapp = {
      appId: input.appId,
      whatsappBusinessAccountId: input.whatsappBusinessAccountId,
      phoneNumberId: input.phoneNumberId,
      numeroTelefoneExibicao: input.numeroTelefoneExibicao,
      webhookVerifyToken: input.webhookVerifyToken,
      appSecretConfigurado: input.appSecret.trim().length > 0,
      accessTokenConfigurado: input.accessToken.trim().length > 0,
      // Nunca "true" no mock — só quando a integração real confirmar a
      // conexão (ex: uma chamada de teste bem-sucedida na Graph API).
      conectado: false,
      salvoPor: input.salvoPor,
      salvoEm: new Date().toISOString(),
    };
    return clonar(configuracaoWhatsapp);
  },

  async listarTextosProntos(): Promise<TextoPronto[]> {
    return fetchJson<TextoPronto[]>("/api/atendimento/textos-prontos");
  },

  async criarTextoPronto(input: CriarTextoProntoInput): Promise<TextoPronto> {
    return fetchJson<TextoPronto>("/api/atendimento/textos-prontos", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async atualizarTextoPronto(id: string, input: AtualizarTextoProntoInput): Promise<TextoPronto> {
    return fetchJson<TextoPronto>(`/api/atendimento/textos-prontos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async removerTextoPronto(id: string): Promise<void> {
    await fetchJson<null>(`/api/atendimento/textos-prontos/${id}`, { method: "DELETE" });
  },

  // Marca as mensagens do cliente como vistas — zera o badge de não
  // lidas da conversa (mesmo comportamento de abrir qualquer chat).
  async marcarComoLida(conversaId: string): Promise<Conversa> {
    return fetchJson<Conversa>(`/api/atendimento/conversas/${conversaId}/marcar-lida`, {
      method: "POST",
    });
  },

  async enviarMensagem(
    conversaId: string,
    analistaNome: string,
    input: EnviarMensagemInput,
  ): Promise<Mensagem> {
    // `analistaNome` continua na assinatura por compatibilidade com quem
    // já chama esta função (thread-conversa.tsx, use-atendimento hook) —
    // o backend ignora esse campo pra autorização e resolve o analista
    // real a partir da sessão (ver atendimento.routes.ts).
    return fetchJson<Mensagem>(`/api/atendimento/conversas/${conversaId}/mensagens`, {
      method: "POST",
      body: JSON.stringify({ analistaNome, ...input }),
    });
  },

  // Slots de documento reprovados (contrato social + RG/procuração por
  // sócio) — alimenta o picker de "vincular mídia recebida no chat".
  async listarDocumentosPendentes(agenciaId: string): Promise<DocumentosPendentesOutput> {
    return fetchJson<DocumentosPendentesOutput>(
      `/api/atendimento/agencias/${agenciaId}/documentos-pendentes`,
    );
  },

  // Vincular = o analista já viu o arquivo no chat e decidiu que é o
  // documento certo — cria o Documento já como aprovado (ver
  // vincular-midia-como-documento.use-case.ts, módulo cadastro).
  async vincularMidiaComoDocumento(midiaId: string, input: VincularMidiaComoDocumentoInput) {
    return fetchJson(`/api/atendimento/midia/${midiaId}/vincular`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
