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

type Unsubscribe = () => void;

const CANAL_CADASTRO = "cadastro_eventos";
const CANAL_ATENDIMENTO = "atendimento_eventos";
const RECONEXAO_INICIAL_MS = 1_000;
const RECONEXAO_MAXIMA_MS = 30_000;

// Conexão dedicada de LISTEN (fora do pool do Prisma) que alimenta as rotas
// SSE de /api/cadastros/eventos, /api/cadastros/[id]/eventos e
// /api/atendimento/eventos. Fica ociosa (sem reconectar) enquanto não há
// nenhum assinante — só conecta quando a primeira rota SSE assina.
class PostgresRealtimeListener {
  private client: Client | null = null;
  private conectando = false;
  private atrasoReconexaoMs = RECONEXAO_INICIAL_MS;
  private readonly cadastroHandlers = new Set<(evento: CadastroEvento) => void>();
  private readonly atendimentoHandlers = new Set<(evento: AtendimentoEvento) => void>();

  subscribeCadastroEventos(handler: (evento: CadastroEvento) => void): Unsubscribe {
    this.cadastroHandlers.add(handler);
    this.conectar();
    return () => this.cadastroHandlers.delete(handler);
  }

  subscribeAtendimentoEventos(handler: (evento: AtendimentoEvento) => void): Unsubscribe {
    this.atendimentoHandlers.add(handler);
    this.conectar();
    return () => this.atendimentoHandlers.delete(handler);
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
      // Uma só query (não Promise.all de duas): client é um pg.Client dedicado,
      // não um Pool — duas chamadas concorrentes no mesmo Client disparam
      // "Calling client.query() when the client is already executing a query
      // is deprecated" (e vai virar erro no pg@9). Sem parâmetros, então o
      // protocolo simple query aceita os dois LISTEN separados por ";".
      .then(() => client.query(`LISTEN ${CANAL_CADASTRO}; LISTEN ${CANAL_ATENDIMENTO}`))
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

    if (mensagem.channel === CANAL_CADASTRO) {
      this.cadastroHandlers.forEach((handler) => handler(payload as CadastroEvento));
    } else if (mensagem.channel === CANAL_ATENDIMENTO) {
      this.atendimentoHandlers.forEach((handler) => handler(payload as AtendimentoEvento));
    }
  }

  private desconectar(): void {
    if (!this.client) return;
    this.client = null;
    this.agendarReconexao();
  }

  private agendarReconexao(): void {
    const atraso = this.atrasoReconexaoMs;
    this.atrasoReconexaoMs = Math.min(this.atrasoReconexaoMs * 2, RECONEXAO_MAXIMA_MS);
    setTimeout(() => {
      if (this.cadastroHandlers.size > 0 || this.atendimentoHandlers.size > 0) {
        this.conectar();
      }
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
