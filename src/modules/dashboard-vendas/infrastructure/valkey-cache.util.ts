import { Valkey } from "iovalkey";

// Cache compartilhado entre instâncias (Cloud Run escala horizontalmente,
// ver docs/realtime-sse.md) pro dashboard de vendas — só isto some sem
// `VALKEY_URL` configurada, e quem chama (`comCache` em
// dashboard-vendas.sst-service.ts) cai pro cache em memória de processo
// de sempre. Isolado a este módulo de propósito: não é um client Valkey
// genérico do projeto.
//
// `lazyConnect`: só abre a conexão TCP na primeira chamada real, não no
// import do módulo (evita travar o boot da aplicação se o Valkey estiver
// fora do ar). `retryStrategy: () => null` desliga a reconexão automática
// do próprio client — cada get/set falha rápido (erro tratado abaixo) em
// vez de empacar a seção esperando o Valkey voltar; a próxima chamada tenta
// reconectar do zero.
let cliente: Valkey | null = null;

function obterCliente(): Valkey | null {
  const url = process.env.VALKEY_URL;
  if (!url) return null;

  if (!cliente) {
    cliente = new Valkey(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    cliente.on("error", (erro) => {
      console.error("[dashboard-vendas] Valkey indisponível — usando só cache em memória.", erro);
    });
  }
  return cliente;
}

// `sst-service.ts` cacheia bastante `Map`/`Set` (ex.: `buscarAereoJanela`,
// `codigosAgenciasAereo`) — `JSON.stringify` comum vira `"{}"` pra eles (sem
// propriedades próprias enumeráveis) e some com o tipo na volta. O
// replacer/reviver abaixo preserva os dois via um envelope explícito, pra
// quem chama `valkeyGet`/`valkeySet` receber de volta exatamente o que
// mandou, igual ao L1 em memória (que guarda a referência original, sem
// serializar nada).
function serializarComTipos(_chave: string, valor: unknown): unknown {
  if (valor instanceof Map) return { __tipo: "Map", entradas: [...valor.entries()] };
  if (valor instanceof Set) return { __tipo: "Set", valores: [...valor] };
  return valor;
}

function desserializarComTipos(_chave: string, valor: unknown): unknown {
  if (valor && typeof valor === "object") {
    if ((valor as { __tipo?: string }).__tipo === "Map") {
      return new Map((valor as { entradas: [unknown, unknown][] }).entradas);
    }
    if ((valor as { __tipo?: string }).__tipo === "Set") {
      return new Set((valor as { valores: unknown[] }).valores);
    }
  }
  return valor;
}

export async function valkeyGet<T>(chave: string): Promise<T | undefined> {
  const client = obterCliente();
  if (!client) return undefined;

  try {
    const bruto = await client.get(chave);
    return bruto === null ? undefined : (JSON.parse(bruto, desserializarComTipos) as T);
  } catch (erro) {
    console.error(
      `[dashboard-vendas] Valkey GET "${chave}" falhou — seguindo sem cache compartilhado.`,
      erro,
    );
    return undefined;
  }
}

export async function valkeySet(chave: string, valor: unknown, ttlSegundos: number): Promise<void> {
  const client = obterCliente();
  if (!client) return;

  try {
    await client.set(chave, JSON.stringify(valor, serializarComTipos), "EX", ttlSegundos);
  } catch (erro) {
    console.error(
      `[dashboard-vendas] Valkey SET "${chave}" falhou — seguindo sem cache compartilhado.`,
      erro,
    );
  }
}
