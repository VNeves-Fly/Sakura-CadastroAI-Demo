import {
  requireSstApiKey,
  sstBaseUrl,
} from "@/modules/cadastro/infrastructure/adapters/flysakura-sst-http.util";
import { valkeyGet, valkeySet } from "@/modules/dashboard-vendas/infrastructure/valkey-cache.util";

// Cliente SST compartilhado só dentro do módulo agencias-crm (entre
// agencia-carteira.sst-service.ts e agencia-detalhe.sst-service.ts — os
// dois nascem juntos, no mesmo domínio). Não é compartilhado com
// dashboard-vendas.sst-service.ts / executivo-dashboard.sst-service.ts —
// aqueles mantêm sua própria cópia por decisão deliberada (bounded
// contexts evoluindo isolados, ver comentário no topo de
// executivo-dashboard.sst-service.ts). Mesmo padrão de cache/retry/
// fallback dos dois, só que fatorado uma vez pra não duplicar uma 3ª vez
// dentro deste módulo.

const TTL_CACHE_MS = 10 * 60 * 1000;
const cache = new Map<string, { expiraEm: number; valor: unknown }>();

export async function comCache<T>(chave: string, buscar: () => Promise<T>): Promise<T> {
  const cacheado = cache.get(chave);
  if (cacheado && cacheado.expiraEm > Date.now()) {
    return cacheado.valor as T;
  }

  const doValkey = await valkeyGet<T>(chave);
  if (doValkey !== undefined) {
    cache.set(chave, { expiraEm: Date.now() + TTL_CACHE_MS, valor: doValkey });
    return doValkey;
  }

  const valor = await buscar();
  cache.set(chave, { expiraEm: Date.now() + TTL_CACHE_MS, valor });
  await valkeySet(chave, valor, TTL_CACHE_MS / 1000);
  return valor;
}

// Só em 5xx/timeout/erro de rede (transiente, vale tentar de novo), nunca
// em 4xx (erro nosso de parâmetro) — mesmo critério de
// dashboard-vendas.sst-service.ts e executivo-dashboard.sst-service.ts,
// mais o timeout abaixo (achado nesta integração, não existia nos 2
// services-irmão: medido por curl real que o SST não aguenta receber
// as ~121 páginas de /api/resumos/terrestre todas de uma vez — a maioria
// trava sem responder em vez de devolver erro HTTP. Sem timeout, um
// `fetch` parado nessas condições pendura a promise pra sempre e a
// listagem/modal nunca resolve).
const TENTATIVAS_5XX = 3;
const TIMEOUT_MS = 20_000;

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sstGet<T>(
  caminho: string,
  parametros: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(caminho, sstBaseUrl());
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor !== undefined) url.searchParams.set(chave, String(valor));
  }

  for (let tentativa = 0; ; tentativa++) {
    const controlador = new AbortController();
    const timeoutId = setTimeout(() => controlador.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: { accept: "application/json", "X-Internal-Secret": requireSstApiKey() },
        signal: controlador.signal,
      });

      if (response.ok) {
        return (await response.json()) as T;
      }

      const corpo = await response.text();
      if (response.status < 500 || tentativa >= TENTATIVAS_5XX) {
        throw new Error(`SST respondeu ${response.status}: ${corpo}`);
      }
    } catch (erro) {
      const ehTimeoutOuRede = erro instanceof Error && erro.name === "AbortError";
      if (!ehTimeoutOuRede || tentativa >= TENTATIVAS_5XX) throw erro;
    } finally {
      clearTimeout(timeoutId);
    }

    await esperar(300 * (tentativa + 1));
  }
}

// Roda `tarefa` sobre `itens` com no máximo `limite` chamadas em voo ao
// mesmo tempo — usado pra paginação em massa (ex.: /api/resumos/terrestre,
// ~121 páginas pra uma janela de 365 dias) sem repetir o achado acima
// (disparar tudo de uma vez via Promise.all faz o SST travar a maioria
// das conexões). 20 é o maior valor testado por curl direto sem timeout;
// mantém margem de segurança abaixo disso.
const LIMITE_CONCORRENCIA_PAGINACAO = 15;

export async function mapComConcorrenciaLimitada<Item, Resultado>(
  itens: Item[],
  tarefa: (item: Item) => Promise<Resultado>,
  limite: number = LIMITE_CONCORRENCIA_PAGINACAO,
): Promise<Resultado[]> {
  const resultado: Resultado[] = new Array(itens.length);
  let proximoIndice = 0;

  async function trabalhador(): Promise<void> {
    while (proximoIndice < itens.length) {
      const indice = proximoIndice++;
      resultado[indice] = await tarefa(itens[indice]!);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, () => trabalhador()));
  return resultado;
}

// Degrada uma seção pro mock em vez de derrubar a página/modal inteiro —
// mesmo padrão de dashboard-vendas.sst-service.ts /
// executivo-dashboard.sst-service.ts.
export async function comFallback<T>(rotulo: string, tarefa: Promise<T>, valorMock: T): Promise<T> {
  try {
    return await tarefa;
  } catch (erro) {
    console.error(
      `[agencias-crm] "${rotulo}" falhou contra o SST — usando mock só nesta seção.`,
      erro,
    );
    return valorMock;
  }
}

// Ponto único real-vs-mock do módulo — sem SST_API_KEY, nenhuma chamada
// ao SST é feita (comportamento "desligado", não "quebrado"). Diferente
// de usaSstReal(sica) em executivo-dashboard.controller.ts: aqui não há
// um "sica de um registro só" desligando tudo, é por environment; cada
// agência sem sicaCodigo cai no mock individualmente no adapter.
export function usaSstReal(): boolean {
  return Boolean(process.env.SST_API_KEY);
}

// Helpers de data compartilhados entre os dois services do módulo
// (carteira e detalhe) — mesma convenção de
// executivo-dashboard.sst-service.ts, só que fatorada uma vez aqui em vez
// de duplicada entre os dois arquivos deste módulo.
export function formatarDataIsoBrasilia(data: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);
}

export function hojeIso(): string {
  return formatarDataIsoBrasilia(new Date());
}

export function diasAtrasIso(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return formatarDataIsoBrasilia(data);
}

export function inicioMesIso(): string {
  const hoje = new Date();
  return formatarDataIsoBrasilia(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
}
