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
   - Canal `solicitacao_atendimento_agencia_eventos` (migração
     `20260730124700_add_solicitacao_atendimento_agencia_trigger`) —
     `AFTER INSERT OR UPDATE` em `solicitacoes_atendimento_agencia` (pedido
     de transferência/assunção do atendimento do CADASTRO — dossiê/
     listagem, distinto do chat). Payload: `{ solicitacaoId, agenciaId,
tipo, status, solicitanteId, atendenteAtualId, novoAtendenteId }`.
     Diferente dos outros dois canais, este é **pessoal**: a rota
     (`/api/atendimento/solicitacoes/eventos`) só repassa pro client se
     `session.user.id` estiver entre os 3 ids envolvidos — quem não faz
     parte do pedido não recebe nada.

2. **Listener compartilhado** —
   `src/modules/shared/infrastructure/realtime/postgres-listener.ts`. Uma
   única conexão `pg.Client` dedicada (fora do pool do Prisma) fazendo
   `LISTEN` nos três canais (`Map<canal, Set<handler>>` genérico — cada novo
   canal só precisa de uma constante + um `subscribeXEventos` novo, ver
   seção "Estendendo" abaixo), com reconexão exponencial (1s → 30s) em
   `error`/`end`. Só conecta quando o primeiro assinante aparece; singleton
   via `globalThis` (mesmo truque do `prismaGlobal` em
   `src/modules/shared/infrastructure/prisma/client.ts`) pra sobreviver ao
   hot-reload do `next dev`.

3. **Helper de resposta SSE** —
   `src/modules/shared/presentation/sse/criar-resposta-sse.ts`. Monta o
   `ReadableStream`/`text/event-stream` comum às 3 rotas: heartbeat a cada
   20s (mantém proxy/load balancer de fechar por inatividade), encerra o
   stream sozinho a cada 10 minutos (o `EventSource` do browser reconecta
   nativamente) e faz cleanup tanto no auto-encerramento quanto no abort do
   cliente (aba fechada).

4. **Rotas** — `src/app/api/cadastros/eventos`,
   `src/app/api/cadastros/[id]/eventos`, `src/app/api/atendimento/eventos`,
   `src/app/api/atendimento/solicitacoes/eventos`. Todas `runtime = "nodejs"`
   (precisa de socket TCP de verdade pro `pg`, não roda em edge), todas
   checam sessão via `getServerSession` (o `middleware.ts` só cobre
   páginas, não `/api/**`).

5. **Client** — `EventSource` nativo (reconecta sozinho em erro/timeout) em
   cada tela consumidora; ver `cadastros-live.tsx`,
   `cadastro-detalhe-live.tsx`, o hook `use-atendimento.view-model.ts` e
   `solicitacoes-atendimento-agencia-live.tsx` (este último montado uma
   única vez em `(admin)/layout.tsx`, não numa página específica — o toast
   de transferência/assunção precisa aparecer em qualquer tela do admin,
   sem abrir uma conexão nova por navegação).

## Múltiplas instâncias — por que não precisa de Redis

Cada instância/pod mantém sua própria conexão `LISTEN`. O Postgres
transmite `NOTIFY` pra **toda** sessão escutando aquele canal, não importa
quantas instâncias existam — cada uma recebe o evento de forma independente
e repassa só pros clientes SSE conectados nela mesma. Isso vale igual em
Cloud Run ou GKE; não há necessidade de um pub/sub intermediário (Redis
etc.) pra sincronizar entre réplicas.

Custo por instância: **+1 conexão persistente** no Postgres, fora do pool
do Prisma. `c2f-postgres-prod` (`db-custom-2-4096`) não tem `databaseFlags`
customizado pra `max_connections` — usa o default do tier, com folga de
sobra pro número de instâncias atual (ver abaixo).

## Hoje (Cloud Run `cadastro-ai-prod`) — configuração real confirmada

Valores confirmados via `gcloud run services describe cadastro-ai-prod
--region=us-east4` em 2026-07-27, não estimados:

- `timeoutSeconds: 700` (~11.6min) — por isso o auto-encerramento do stream
  em `criar-resposta-sse.ts` está em 10min (`DURACAO_MAXIMA_MS`), com
  margem de ~100s antes do corte da plataforma.
- `autoscaling.knative.dev/minScale: 2`, `maxScale: 10` — sempre ao menos 2
  instâncias de pé (sem cold-start pra primeira conexão SSE do dia), até 10
  em pico (= até 10 conexões `LISTEN` extras simultâneas no Postgres).
- `run.googleapis.com/cpu-throttling: 'false'` — CPU sempre alocada, mesmo
  sem request em andamento na instância. Isso elimina a preocupação comum
  de Cloud Run "congelar" trabalho em background (como o processamento da
  conexão `LISTEN`) em instância ociosa — aqui não se aplica.
- `sessionAffinity: 'false'` — não afeta o SSE: uma conexão já aberta fica
  naturalmente presa à mesma instância pela própria conexão HTTP, session
  affinity só importa pra rotear requests _separadas_ pra mesma instância.

Existe também `c2f-postgres-homolog` (staging, `db-g1-small`) — não foi
usado pra esta feature (migração testada local + aplicada direto em prod,
por decisão do usuário), mas fica registrado como opção pra próxima vez que
fizer sentido testar uma migração antes de produção.

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
- **Timeout do backend/Service**: equivalente ao `timeoutSeconds: 700` do
  Cloud Run hoje — confira o timeout configurado no load balancer/
  BackendConfig (se GKE com GCLB) ou no Ingress controller, e ajuste
  `DURACAO_MAXIMA_MS` em `criar-resposta-sse.ts` (hoje 10min, com margem
  pro timeout atual de 700s) se o novo timeout for diferente — menos
  reconexões do `EventSource`, sem ganho funcional, só menos overhead.
- **`cpu-throttling: false`**: confirme que os pods GKE não têm o
  equivalente de "CPU só durante request" (não é um conceito nativo do
  GKE — pods sempre têm CPU alocada pela própria natureza do
  Kubernetes —, mas vale checar `resources.requests.cpu` no Deployment pra
  não sub-provisionar e deixar o processamento do `LISTEN` competindo por
  CPU com o resto do pod).
- **Réplicas mínimas**: o equivalente ao `minScale: 2` do Cloud Run vira
  `replicas`/HPA `minReplicas` do Deployment — mesma recomendação de manter
  pelo menos 2 sempre de pé.
- **Conexões do Postgres**: GKE tende a manter réplicas "sempre quentes"
  (sem scale-to-zero), então o número de conexões `LISTEN` extras fica mais
  previsível (= número de pods), mas também mais constante — vale checar o
  limite de conexões do Cloud SQL/tier do banco antes de aumentar o
  `minReplicas` além do `maxScale: 10` atual do Cloud Run.
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
