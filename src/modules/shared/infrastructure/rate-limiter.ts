// Rate limit em memória (janela fixa), por chave arbitrária (ex: IP +
// nome da rota). Sem Redis/infra externa disponível neste projeto — pro
// volume de um cadastro público (poucas escritas por minuto), um Map em
// processo já resolve. Se a aplicação rodar em múltiplas instâncias no
// futuro, trocar por um store compartilhado (Redis) sem mudar quem chama
// `verificarRateLimit`.
interface Janela {
  contagem: number;
  expiraEm: number;
}

const janelasPorChave = new Map<string, Janela>();

export interface RateLimitConfig {
  limite: number;
  janelaMs: number;
}

// Retorna true se a chamada é permitida (e já contabiliza essa chamada).
// Retorna false se estourou o limite dentro da janela atual.
export function verificarRateLimit(chave: string, config: RateLimitConfig): boolean {
  const agora = Date.now();
  const janela = janelasPorChave.get(chave);

  if (!janela || agora >= janela.expiraEm) {
    janelasPorChave.set(chave, { contagem: 1, expiraEm: agora + config.janelaMs });
    return true;
  }

  if (janela.contagem >= config.limite) {
    return false;
  }

  janela.contagem += 1;
  return true;
}

// IP do cliente a partir dos headers padrão de proxy — o Next.js roda
// atrás de um proxy (Vercel, nginx, etc.) que popula x-forwarded-for.
export function obterIpCliente(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "desconhecido";

  const realIp = request.headers.get("x-real-ip");
  return realIp ?? "desconhecido";
}
