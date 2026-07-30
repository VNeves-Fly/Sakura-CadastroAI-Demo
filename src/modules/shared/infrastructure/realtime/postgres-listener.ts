import { Client, type Notification } from "pg";

export interface CadastroEvento {
  tabela: string;
  agenciaId: string;
  // Id da linha que disparou o evento — sem isso não dá pra saber qual
  // linha exatamente mudou quando várias são inseridas quase juntas na
  // mesma tabela (ex.: documentos do wizard, todos na mesma transação).
  id: string;
  tipo: "INSERT" | "UPDATE";
}

export interface AtendimentoEvento {
  conversaId: string;
}

// Pedido de transferência/assunção de atendimento do CADASTRO da agência
// (SolicitacaoAtendimentoAgencia) — canal próprio, distinto de
// AtendimentoEvento (chat/Conversa).
export interface SolicitacaoAtendimentoAgenciaEvento {
  solicitacaoId: string;
  agenciaId: string;
  tipo: "TRANSFERENCIA" | "ASSUNCAO";
  status: "PENDENTE" | "ACEITA" | "CANCELADA";
  solicitanteId: string;
  atendenteAtualId: string;
  novoAtendenteId: string;
}

type Unsubscribe = () => void;

const CANAL_CADASTRO = "cadastro_eventos";
const CANAL_ATENDIMENTO = "atendimento_eventos";
const CANAL_SOLICITACAO_ATENDIMENTO_AGENCIA = "solicitacao_atendimento_agencia_eventos";
const CANAIS = [CANAL_CADASTRO, CANAL_ATENDIMENTO, CANAL_SOLICITACAO_ATENDIMENTO_AGENCIA] as const;
type Canal = (typeof CANAIS)[number];

const RECONEXAO_INICIAL_MS = 1_000;
const RECONEXAO_MAXIMA_MS = 30_000;

// Conexão dedicada de LISTEN (fora do pool do Prisma) que alimenta as rotas
// SSE de /api/cadastros/eventos, /api/cadastros/[id]/eventos,
// /api/atendimento/eventos e /api/atendimento/solicitacoes/eventos. Fica
// ociosa (sem reconectar) enquanto não há nenhum assinante — só conecta
// quando o primeiro assinante (de qualquer canal) aparece.
class PostgresRealtimeListener {
  private client: Client | null = null;
  private conectando = false;
  private atrasoReconexaoMs = RECONEXAO_INICIAL_MS;
  private readonly handlersPorCanal = new Map<Canal, Set<(evento: unknown) => void>>(
    CANAIS.map((canal) => [canal, new Set<(evento: unknown) => void>()]),
  );

  private subscribe<T>(canal: Canal, handler: (evento: T) => void): Unsubscribe {
    const handlers = this.handlersPorCanal.get(canal)!;
    const handlerGenerico = handler as (evento: unknown) => void;
    handlers.add(handlerGenerico);
    this.conectar();
    return () => handlers.delete(handlerGenerico);
  }

  subscribeCadastroEventos(handler: (evento: CadastroEvento) => void): Unsubscribe {
    return this.subscribe(CANAL_CADASTRO, handler);
  }

  subscribeAtendimentoEventos(handler: (evento: AtendimentoEvento) => void): Unsubscribe {
    return this.subscribe(CANAL_ATENDIMENTO, handler);
  }

  subscribeSolicitacaoAtendimentoAgenciaEventos(
    handler: (evento: SolicitacaoAtendimentoAgenciaEvento) => void,
  ): Unsubscribe {
    return this.subscribe(CANAL_SOLICITACAO_ATENDIMENTO_AGENCIA, handler);
  }

  private conectar(): void {
    if (this.client || this.conectando) return;
    this.conectando = true;

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ...(process.env.DATABASE_CA_CERT && {
        ssl: {
          ca: process.env.DATABASE_CA_CERT,
          rejectUnauthorized: true,
          checkServerIdentity: () => undefined,
        },
      }),
    });

    client.on("notification", (mensagem: Notification) => this.despachar(mensagem));
    // Um só handler de desconexão pro client inteiro — "error" custuma vir
    // seguido de "end" pro mesmo socket; desconectar() é idempotente (só a
    // primeira chamada agenda reconexão, a segunda vê this.client já nulo).
    client.on("error", () => this.desconectar());
    client.on("end", () => this.desconectar());

    client
      .connect()
      // Uma só query (não Promise.all): client é um pg.Client dedicado, não
      // um Pool — chamadas concorrentes no mesmo Client disparam warning de
      // depreciação (e vai virar erro no pg@9). Sem parâmetros, então o
      // protocolo simple query aceita os LISTEN separados por ";".
      .then(() => client.query(CANAIS.map((canal) => `LISTEN ${canal}`).join("; ")))
      .then(() => {
        this.client = client;
        this.conectando = false;
        this.atrasoReconexaoMs = RECONEXAO_INICIAL_MS;
      })
      .catch(() => {
        this.conectando = false;
        client.end().catch(() => {});
        this.agendarReconexao();
      });
  }

  private despachar(mensagem: Notification): void {
    if (!mensagem.payload) return;

    let payload: unknown;
    try {
      payload = JSON.parse(mensagem.payload);
    } catch {
      return;
    }

    const canal = mensagem.channel as Canal;
    this.handlersPorCanal.get(canal)?.forEach((handler) => handler(payload));
  }

  private desconectar(): void {
    if (!this.client) return;
    this.client = null;
    this.agendarReconexao();
  }

  private temAssinante(): boolean {
    for (const handlers of this.handlersPorCanal.values()) {
      if (handlers.size > 0) return true;
    }
    return false;
  }

  private agendarReconexao(): void {
    const atraso = this.atrasoReconexaoMs;
    this.atrasoReconexaoMs = Math.min(this.atrasoReconexaoMs * 2, RECONEXAO_MAXIMA_MS);
    setTimeout(() => {
      if (this.temAssinante()) this.conectar();
    }, atraso);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var postgresRealtimeListenerGlobal: PostgresRealtimeListener | undefined;
}

export const postgresRealtimeListener =
  globalThis.postgresRealtimeListenerGlobal ?? new PostgresRealtimeListener();

if (process.env.NODE_ENV !== "production") {
  globalThis.postgresRealtimeListenerGlobal = postgresRealtimeListener;
}
