# Realtime via SSE + Postgres LISTEN/NOTIFY

Como a tela `/cadastros` (lista e dossiê) e `/atendimento` atualizam sozinhas,
sem polling client-side. Ver também o plano original da feature, se ainda
existir em `~/.claude/plans/`.

## Por que não é polling

O disparo vem de **triggers no Postgres** (`pg_notify`), não de código de
aplicação chamando "emitir evento" em cada rota que muda dado. Isso cobre
automaticamente qualquer caminho de escrita — incluindo o webhook do
WhatsApp (`src/app/api/webhooks/whatsapp/route.ts`, que insere `Mensagem`
fora de qualquer ação de analista) — sem precisar lembrar de instrumentar
cada mutação manualmente.

## Peças

1. **Triggers** (migração `prisma/migrations/20260727005525_add_notify_triggers`):
   - Canal `cadastro_eventos` — `AFTER INSERT OR UPDATE` em `agencias`,
     `documentos`, `contratos`, `representantes_legais`. Payload:
     `{ tabela, agenciaId, tipo }` (`tabela` vem no plural, nome literal da
     tabela — ex. `"agencias"`, não `"agencia"`).
   - Canal `atendimento_eventos` — `AFTER INSERT`/`UPDATE` em `mensagens`,
     `assumir_atendimento_registros`, `solicitacoes_transferencia`. Payload:
     `{ conversaId }` (o front sempre refaz `listarConversas()` inteiro ao
     receber, igual ao polling que este canal substituiu).

2. **Listener compartilhado** —
   `src/modules/shared/infrastructure/realtime/postgres-listener.ts`. Uma
   única conexão `pg.Client` dedicada (fora do pool do Prisma) fazendo
   `LISTEN` nos dois canais, com reconexão exponencial (1s → 30s) em
   `error`/`end`. Só conecta quando o primeiro assinante aparece; singleton
   via `globalThis` (mesmo truque do `prismaGlobal` em
   `src/modules/shared/infrastructure/prisma/client.ts`) pra sobreviver ao
   hot-reload do `next dev`.

3. **Helper de resposta SSE** —
   `src/modules/shared/presentation/sse/criar-resposta-sse.ts`. Monta o
   `ReadableStream`/`text/event-stream` comum às 3 rotas: heartbeat a cada
   20s (mantém proxy/load balancer de fechar por inatividade), encerra o
   stream sozinho a cada 4 minutos (o `EventSource` do browser reconecta
   nativamente) e faz cleanup tanto no auto-encerramento quanto no abort do
   cliente (aba fechada).

4. **Rotas** — `src/app/api/cadastros/eventos`,
   `src/app/api/cadastros/[id]/eventos`, `src/app/api/atendimento/eventos`.
   Todas `runtime = "nodejs"` (precisa de socket TCP de verdade pro `pg`,
   não roda em edge), todas checam sessão via `getServerSession` (o
   `middleware.ts` só cobre páginas, não `/api/**`).

5. **Client** — `EventSource` nativo (reconecta sozinho em erro/timeout) em
   cada tela consumidora; ver `cadastros-live.tsx`,
   `cadastro-detalhe-live.tsx` e o hook `use-atendimento.view-model.ts`.

## Múltiplas instâncias — por que não precisa de Redis

Cada instância/pod mantém sua própria conexão `LISTEN`. O Postgres
transmite `NOTIFY` pra **toda** sessão escutando aquele canal, não importa
quantas instâncias existam — cada uma recebe o evento de forma independente
e repassa só pros clientes SSE conectados nela mesma. Isso vale igual em
Cloud Run ou GKE; não há necessidade de um pub/sub intermediário (Redis
etc.) pra sincronizar entre réplicas.

Custo por instância: **+1 conexão persistente** no Postgres, fora do pool
do Prisma. Vale olhar o limite de conexões do tier do banco se o número de
instâncias crescer bastante.

## Hoje (Cloud Run) — ajustes de config já considerados no código

- Timeout de request do Cloud Run costuma ser 5min por padrão — por isso o
  auto-encerramento do stream em `criar-resposta-sse.ts` está em 4min
  (`DURACAO_MAXIMA_MS`), sempre um pouco antes do corte da plataforma.
- `min-instances ≥ 1` reduz o atraso de cold-start antes da conexão
  `LISTEN` ficar pronta na primeira conexão SSE do dia — não é obrigatório,
  só melhora a latência inicial.

## Quando migrar pra GKE

O desenho não muda — é o mesmo padrão (LISTEN/NOTIFY + SSE) independente da
plataforma, e o ponto acima sobre múltiplas instâncias já cobre réplicas de
pod. O que precisa de atenção na hora da migração:

- **Buffering do Ingress**: se o tráfego passar por um `nginx-ingress` (ou
  qualquer proxy reverso na frente dos pods), confirme que a resposta
  streaming não está sendo bufferizada — isso faria o SSE "chegar tudo de
  uma vez" só quando o buffer enche ou a conexão fecha, matando o
  tempo-real. Pro `ingress-nginx` isso é a annotation
  `nginx.ingress.kubernetes.io/proxy-buffering: "off"` (e configurar
  `proxy-read-timeout`/`proxy-send-timeout` generosos o bastante pra não
  cortar a conexão antes do nosso auto-encerramento de 4min).
- **Timeout do backend/Service**: equivalente ao timeout de request do
  Cloud Run — confira o timeout configurado no load balancer/BackendConfig
  (se GKE com GCLB) ou no Ingress controller, e ajuste `DURACAO_MAXIMA_MS`
  em `criar-resposta-sse.ts` se quiser aproveitar um timeout maior (menos
  reconexões do `EventSource`, sem ganho funcional — só menos overhead).
- **Réplicas mínimas**: o equivalente a `min-instances` do Cloud Run vira
  `replicas`/HPA `minReplicas` do Deployment — mesma recomendação de manter
  pelo menos 1-2 sempre de pé.
- **Conexões do Postgres**: GKE tende a manter réplicas "sempre quentes"
  (sem scale-to-zero), então o número de conexões `LISTEN` extras fica mais
  previsível (= número de pods), mas também mais constante — vale checar o
  limite de conexões do Cloud SQL/tier do banco antes de aumentar o
  `minReplicas`.
- Fora isso, nenhuma mudança de código é esperada — o listener, as rotas e
  o client-side continuam iguais.

## Estendendo pra novas tabelas/eventos

Pra cobrir uma tabela nova no canal `cadastro_eventos`: adicionar uma
migração com `CREATE TRIGGER ... AFTER INSERT OR UPDATE ON <tabela> FOR EACH
ROW EXECUTE FUNCTION notificar_cadastro_evento();` — a função já existente
extrai `agenciaId` de `NEW."agenciaId"` (funciona pra qualquer tabela que
tenha essa coluna; para uma tabela sem FK direta pra `agencias`, a função
precisa de um `CASE` novo, igual o que já existe pra distinguir `agencias`
das demais).
