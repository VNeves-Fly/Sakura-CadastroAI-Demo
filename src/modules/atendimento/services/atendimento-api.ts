import type {
  Conversa,
  Mensagem,
  TextoPronto,
  EnviarMensagemInput,
  AssumirAtendimentoInput,
  CriarTextoProntoInput,
  SolicitarTransferenciaInput,
  ResponderTransferenciaInput,
} from "@/modules/atendimento/types/atendimento.types";
import {
  gerarConversasMock,
  gerarTextosProntosMock,
  gerarTemplatesAprovadosMock,
} from "@/modules/atendimento/mock/atendimento-mock.data";

// Troque pelas chamadas reais (fetch pra uma rota /api/atendimento/*)
// quando o back-end existir — hoje não existe nem as tabelas
// (Conversa/Mensagem/TextoPronto/AssumirAtendimento/SolicitacaoTransferencia)
// nem a integração com a API do WhatsApp Business (Meta), então esse
// service só finge ser uma API (funções async, mesma assinatura que uma
// real teria) por cima de um "banco" em memória. Decisão explícita do
// usuário (2026-07-23): construir o front primeiro, back depois.

export const HORAS_LIMITE_ASSUMIR = 2;
export const TIMEOUT_TRANSFERENCIA_MS = 60_000;

// "Banco" em memória — módulo é singleton no processo do navegador, então
// o estado sobrevive entre chamadas (mas reseta a cada reload de página,
// já que não é persistido de verdade).
let conversas = gerarConversasMock();
let textosProntos = gerarTextosProntosMock();
const templatesAprovados = gerarTemplatesAprovadosMock();

function atraso(ms = 150): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T;
}

function encontrarOuFalhar(conversaId: string): Conversa {
  const conversa = conversas.find((item) => item.id === conversaId);
  if (!conversa) throw new Error("Conversa não encontrada.");
  return conversa;
}

export function podeAssumirAtendimento(atendimentoAtual: Conversa["atendimentoAtual"]): boolean {
  if (!atendimentoAtual) return true;
  const horasDesdeAssumiu =
    (Date.now() - new Date(atendimentoAtual.assumidoEm).getTime()) / (1000 * 60 * 60);
  return horasDesdeAssumiu > HORAS_LIMITE_ASSUMIR;
}

// Fecha o registro atual (se houver) e abre um novo — reaproveitado por
// assumir (de ninguém ou de quem sumiu há +2h), puxar (mesma coisa, só
// nome de botão diferente na tela) e transferência aceita.
function atribuirAtendimento(conversaId: string, analistaNome: string): void {
  const agoraIso = new Date().toISOString();
  const novoRegistro = { analistaNome, assumidoEm: agoraIso, liberadoEm: null };

  conversas = conversas.map((item) => {
    if (item.id !== conversaId) return item;
    const atual = item.atendimentoAtual;
    const historicoFechado = atual
      ? item.historicoAtendimento.map((registro) =>
          registro.analistaNome === atual.analistaNome && registro.assumidoEm === atual.assumidoEm
            ? { ...registro, liberadoEm: agoraIso }
            : registro,
        )
      : item.historicoAtendimento;

    return {
      ...item,
      atendimentoAtual: novoRegistro,
      historicoAtendimento: [...historicoFechado, novoRegistro],
    };
  });
}

// Resolve (aceita/recusa/expira) uma solicitação pendente — chamado tanto
// pela resposta manual do analista quanto pelo timeout de 60s.
function resolverSolicitacao(
  solicitacaoId: string,
  status: "aceita" | "recusada" | "expirada",
): void {
  conversas = conversas.map((item) => {
    if (item.solicitacaoTransferenciaPendente?.id !== solicitacaoId) return item;
    // Já foi resolvida por outro caminho (ex: analista respondeu antes do
    // timeout disparar) — não faz nada de novo.
    if (item.solicitacaoTransferenciaPendente.status !== "pendente") return item;

    return {
      ...item,
      solicitacaoTransferenciaPendente: { ...item.solicitacaoTransferenciaPendente, status },
    };
  });

  if (status === "aceita") {
    const conversa = conversas.find(
      (item) => item.solicitacaoTransferenciaPendente?.id === solicitacaoId,
    );
    if (conversa?.solicitacaoTransferenciaPendente) {
      atribuirAtendimento(conversa.id, conversa.solicitacaoTransferenciaPendente.paraAnalista);
    }
  }
}

export const atendimentoApi = {
  async listarConversas(): Promise<Conversa[]> {
    await atraso();
    return clonar(conversas);
  },

  async listarTemplatesAprovados() {
    await atraso();
    return clonar(templatesAprovados);
  },

  async listarTextosProntos(): Promise<TextoPronto[]> {
    await atraso();
    return clonar(textosProntos);
  },

  async criarTextoPronto(input: CriarTextoProntoInput): Promise<TextoPronto> {
    await atraso();
    const novo: TextoPronto = { id: crypto.randomUUID(), ...input };
    textosProntos = [...textosProntos, novo];
    return clonar(novo);
  },

  // Marca as mensagens do cliente como vistas — zera o badge de não
  // lidas da conversa (mesmo comportamento de abrir qualquer chat).
  async marcarComoLida(conversaId: string): Promise<Conversa> {
    await atraso(50);
    conversas = conversas.map((conversa) =>
      conversa.id === conversaId
        ? {
            ...conversa,
            mensagens: conversa.mensagens.map((mensagem) =>
              mensagem.autor === "cliente" ? { ...mensagem, lido: true } : mensagem,
            ),
          }
        : conversa,
    );
    return clonar(encontrarOuFalhar(conversaId));
  },

  async enviarMensagem(
    conversaId: string,
    analistaNome: string,
    input: EnviarMensagemInput,
  ): Promise<Mensagem> {
    await atraso();
    const novaMensagem: Mensagem = {
      id: crypto.randomUUID(),
      conversaId,
      autor: "analista",
      analistaNome,
      createdAt: new Date().toISOString(),
      // Mock: nunca temos confirmação real de leitura do cliente (não
      // existe webhook de verdade) — fica sempre "entregue" (1 check),
      // nunca "lido" (2 checks azuis), pra não simular um dado que não
      // existe.
      lido: false,
      ...input,
    };

    conversas = conversas.map((conversa) =>
      conversa.id === conversaId
        ? {
            ...conversa,
            mensagens: [...conversa.mensagens, novaMensagem],
            updatedAt: novaMensagem.createdAt,
            lastMessageAt: novaMensagem.createdAt,
          }
        : conversa,
    );

    return clonar(novaMensagem);
  },

  // Cobre tanto "Assumir" (conversa sem ninguém atendendo) quanto "Puxar"
  // (de um analista inativo há +2h) — mesma regra, o texto do botão é
  // decidido na tela (ver AssumirAtendimentoBanner).
  async assumirAtendimento(conversaId: string, input: AssumirAtendimentoInput): Promise<Conversa> {
    await atraso();
    const conversa = encontrarOuFalhar(conversaId);
    if (!podeAssumirAtendimento(conversa.atendimentoAtual)) {
      throw new Error("Esta conversa ainda está com outro analista há menos de 2h.");
    }

    atribuirAtendimento(conversaId, input.analistaNome);
    return clonar(encontrarOuFalhar(conversaId));
  },

  // Encerra o atendimento — fica sem ninguém atendendo (histórico
  // preserva quem atendeu e por quanto tempo). Diferente de "puxar": aqui
  // não sobra pendência nenhuma, é o analista atual dizendo "resolvido".
  async encerrarAtendimento(conversaId: string): Promise<Conversa> {
    await atraso();
    const agoraIso = new Date().toISOString();

    conversas = conversas.map((item) => {
      if (item.id !== conversaId || !item.atendimentoAtual) return item;
      const atual = item.atendimentoAtual;

      return {
        ...item,
        atendimentoAtual: null,
        historicoAtendimento: item.historicoAtendimento.map((registro) =>
          registro.analistaNome === atual.analistaNome && registro.assumidoEm === atual.assumidoEm
            ? { ...registro, liberadoEm: agoraIso }
            : registro,
        ),
      };
    });

    return clonar(encontrarOuFalhar(conversaId));
  },

  // Pede transferência explícita pra outro analista — diferente de
  // "puxar", não depende de ninguém estar inativo. Expira sozinha em 60s
  // sem resposta (contada como recusa).
  async solicitarTransferencia(
    conversaId: string,
    input: SolicitarTransferenciaInput,
  ): Promise<Conversa> {
    await atraso();
    const conversa = encontrarOuFalhar(conversaId);
    if (conversa.solicitacaoTransferenciaPendente?.status === "pendente") {
      throw new Error("Já existe uma transferência pendente pra esta conversa.");
    }

    const solicitacao = {
      id: crypto.randomUUID(),
      conversaId,
      deAnalista: input.deAnalista,
      paraAnalista: input.paraAnalista,
      status: "pendente" as const,
      criadaEm: new Date().toISOString(),
    };

    conversas = conversas.map((item) =>
      item.id === conversaId ? { ...item, solicitacaoTransferenciaPendente: solicitacao } : item,
    );

    setTimeout(() => resolverSolicitacao(solicitacao.id, "expirada"), TIMEOUT_TRANSFERENCIA_MS);

    return clonar(encontrarOuFalhar(conversaId));
  },

  async responderTransferencia(
    conversaId: string,
    input: ResponderTransferenciaInput,
  ): Promise<Conversa> {
    await atraso(100);
    const conversa = encontrarOuFalhar(conversaId);
    const solicitacao = conversa.solicitacaoTransferenciaPendente;
    if (!solicitacao || solicitacao.status !== "pendente") {
      throw new Error("Não há transferência pendente pra responder.");
    }

    resolverSolicitacao(solicitacao.id, input.aceita ? "aceita" : "recusada");
    return clonar(encontrarOuFalhar(conversaId));
  },

  // Some com o aviso de "recusada/expirada" da tela de quem pediu, depois
  // que ele já viu — não existe um "lido" real aqui, é só limpar o
  // ponteiro local pra próxima solicitação poder ser feita.
  async limparSolicitacaoResolvida(conversaId: string): Promise<Conversa> {
    await atraso(50);
    conversas = conversas.map((item) =>
      item.id === conversaId && item.solicitacaoTransferenciaPendente?.status !== "pendente"
        ? { ...item, solicitacaoTransferenciaPendente: null }
        : item,
    );
    return clonar(encontrarOuFalhar(conversaId));
  },
};
