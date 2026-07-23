import type {
  Conversa,
  Mensagem,
  TextoPronto,
  TemplateAprovado,
  ConfiguracaoWhatsappBusiness,
  EnviarMensagemInput,
  AssumirAtendimentoInput,
  CriarTextoProntoInput,
  AtualizarTextoProntoInput,
  SolicitarTransferenciaInput,
  ResponderTransferenciaInput,
  CriarTemplateInput,
  SalvarConfiguracaoWhatsappInput,
  ResultadoTesteConexao,
} from "@/modules/atendimento/types/atendimento.types";
import { HORAS_LIMITE_ASSUMIR } from "@/modules/atendimento/domain/atendimento.constants";
import {
  gerarTemplatesAprovadosMock,
  gerarConfiguracaoWhatsappMock,
} from "@/modules/atendimento/mock/atendimento-mock.data";

// Chamadas reais pra /api/atendimento/* onde a rota já existe. Gestão de
// templates e configuração do WhatsApp (Messenger) ainda não têm rota —
// continuam sobre um "banco" em memória só pra essas duas áreas.
export { HORAS_LIMITE_ASSUMIR };
export const TIMEOUT_TRANSFERENCIA_MS = 60_000;

let templates = gerarTemplatesAprovadosMock();
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

export function podeAssumirAtendimento(atendimentoAtual: Conversa["atendimentoAtual"]): boolean {
  if (!atendimentoAtual) return true;
  const horasDesdeAssumiu =
    (Date.now() - new Date(atendimentoAtual.assumidoEm).getTime()) / (1000 * 60 * 60);
  return horasDesdeAssumiu > HORAS_LIMITE_ASSUMIR;
}

export const atendimentoApi = {
  async listarConversas(): Promise<Conversa[]> {
    return fetchJson<Conversa[]>("/api/atendimento/conversas");
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
    await atraso();
    return clonar(templates);
  },

  // "Enviar pra aprovação da Meta" — no mock, só cria com status
  // pendente; a aprovação de verdade (webhook de status do template) só
  // existe quando a integração real com a API do WhatsApp Business
  // acontecer. Nunca simula um "aprovado" instantâneo — seria inventar
  // uma decisão que só a Meta pode tomar.
  async criarTemplate(input: CriarTemplateInput): Promise<TemplateAprovado> {
    await atraso();
    const novo: TemplateAprovado = {
      id: crypto.randomUUID(),
      ...input,
      status: "pendente_aprovacao",
      motivoRejeicao: null,
      criadoEm: new Date().toISOString(),
    };
    templates = [...templates, novo];
    return clonar(novo);
  },

  // Reenviar um template rejeitado — Meta não deixa "reenviar" o exato
  // mesmo texto que já foi recusado, então isso sempre exige editar o
  // conteúdo antes de submeter de novo (nome/categoria/idioma continuam
  // os mesmos). Some o motivo antigo e volta pra "pendente_aprovacao".
  async reenviarTemplate(id: string, novoConteudo: string): Promise<TemplateAprovado> {
    await atraso();
    const template = templates.find((item) => item.id === id);
    if (!template) throw new Error("Template não encontrado.");
    if (template.status !== "rejeitado") {
      throw new Error("Só é possível reenviar um template rejeitado.");
    }

    templates = templates.map((item) =>
      item.id === id
        ? {
            ...item,
            conteudo: novoConteudo,
            status: "pendente_aprovacao",
            motivoRejeicao: null,
            criadoEm: new Date().toISOString(),
          }
        : item,
    );

    const atualizado = templates.find((item) => item.id === id);
    if (!atualizado) throw new Error("Template não encontrado.");
    return clonar(atualizado);
  },

  async obterConfiguracaoWhatsapp(): Promise<ConfiguracaoWhatsappBusiness> {
    await atraso();
    return clonar(configuracaoWhatsapp);
  },

  // "Testar conexão" — no mock, só confirma que os campos obrigatórios
  // foram preenchidos (não bate na Graph API de verdade, que é o que
  // faria isso de fato). Nunca marca `conectado: true` sozinho — esse
  // campo só vira true quando existir uma chamada real bem-sucedida.
  async testarConexaoWhatsapp(): Promise<ResultadoTesteConexao> {
    await atraso(400);
    const faltando: string[] = [];
    if (!configuracaoWhatsapp.appId) faltando.push("App ID");
    if (!configuracaoWhatsapp.whatsappBusinessAccountId)
      faltando.push("WhatsApp Business Account ID");
    if (!configuracaoWhatsapp.phoneNumberId) faltando.push("Phone Number ID");
    if (!configuracaoWhatsapp.accessTokenConfigurado) faltando.push("Access Token");

    if (faltando.length > 0) {
      return {
        sucesso: false,
        mensagem: `Faltam campos obrigatórios: ${faltando.join(", ")}.`,
      };
    }

    return {
      sucesso: false,
      mensagem:
        "Campos obrigatórios preenchidos, mas ainda não há chamada real à Graph API da Meta — teste simulado, sem validar credencial de verdade.",
    };
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

  // Rota ainda não existe no backend (só GET/POST em /textos-prontos hoje).
  async atualizarTextoPronto(id: string, input: AtualizarTextoProntoInput): Promise<TextoPronto> {
    return fetchJson<TextoPronto>(`/api/atendimento/textos-prontos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  // Rota ainda não existe no backend (só GET/POST em /textos-prontos hoje).
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

  // Cobre tanto "Assumir" (conversa sem ninguém atendendo) quanto "Puxar"
  // (de um analista inativo há +2h) — mesma regra, o texto do botão é
  // decidido na tela (ver AssumirAtendimentoBanner).
  async assumirAtendimento(conversaId: string, input: AssumirAtendimentoInput): Promise<Conversa> {
    return fetchJson<Conversa>(`/api/atendimento/conversas/${conversaId}/assumir`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  // Encerra o atendimento — fica sem ninguém atendendo (histórico
  // preserva quem atendeu e por quanto tempo). Diferente de "puxar": aqui
  // não sobra pendência nenhuma, é o analista atual dizendo "resolvido".
  // Rota ainda não existe no backend.
  async encerrarAtendimento(conversaId: string): Promise<Conversa> {
    return fetchJson<Conversa>(`/api/atendimento/conversas/${conversaId}/encerrar`, {
      method: "POST",
    });
  },

  // Pede transferência explícita pra outro analista — diferente de
  // "puxar", não depende de ninguém estar inativo. Expira sozinha em 60s
  // sem resposta (contada como recusa) — expiração é responsabilidade do
  // backend quando a rota existir. Rota ainda não existe no backend.
  async solicitarTransferencia(
    conversaId: string,
    input: SolicitarTransferenciaInput,
  ): Promise<Conversa> {
    return fetchJson<Conversa>(`/api/atendimento/conversas/${conversaId}/transferencia`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  // Rota ainda não existe no backend.
  async responderTransferencia(
    conversaId: string,
    input: ResponderTransferenciaInput,
  ): Promise<Conversa> {
    return fetchJson<Conversa>(`/api/atendimento/conversas/${conversaId}/transferencia/responder`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  // Some com o aviso de "recusada/expirada" da tela de quem pediu, depois
  // que ele já viu — não existe um "lido" real aqui, é só limpar o
  // ponteiro local pra próxima solicitação poder ser feita. Rota ainda
  // não existe no backend.
  async limparSolicitacaoResolvida(conversaId: string): Promise<Conversa> {
    return fetchJson<Conversa>(`/api/atendimento/conversas/${conversaId}/transferencia/limpar`, {
      method: "POST",
    });
  },
};
