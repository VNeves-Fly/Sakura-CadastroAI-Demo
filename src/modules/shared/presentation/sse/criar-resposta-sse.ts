type Unsubscribe = () => void;

const HEARTBEAT_MS = 20_000;
// O serviço cadastro-ai-prod no Cloud Run está configurado com
// timeoutSeconds: 700 (~11.6min) — encerramos sozinhos um pouco antes disso
// (10min, margem de ~100s); o EventSource do browser reconecta
// automaticamente (retry nativo), então o ciclo fica invisível pra quem
// está vendo a tela. Se o timeout do serviço mudar, ajustar aqui junto.
const DURACAO_MAXIMA_MS = 10 * 60 * 1000;

// Monta a Response streaming (text/event-stream) comum às rotas SSE:
// heartbeat pra manter proxies/load balancer sem fechar por inatividade,
// auto-encerramento antes do timeout de request da plataforma, e cleanup
// tanto no auto-encerramento quanto no abort (cliente fechou a aba/trocou
// de página). `iniciarAssinatura` recebe a função `enviar` e devolve o
// unsubscribe da fonte de eventos (ex.: postgresRealtimeListener).
export function criarRespostaSse(
  request: Request,
  iniciarAssinatura: (enviar: (dados: unknown) => void) => Unsubscribe,
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const enviar = (dados: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(dados)}\n\n`));
      };

      const unsubscribe = iniciarAssinatura(enviar);

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, HEARTBEAT_MS);

      const encerrar = () => {
        clearInterval(heartbeat);
        clearTimeout(timeoutEncerramento);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // stream já fechado (cliente desconectou antes do nosso encerramento)
        }
      };

      const timeoutEncerramento = setTimeout(encerrar, DURACAO_MAXIMA_MS);

      request.signal.addEventListener("abort", encerrar);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
