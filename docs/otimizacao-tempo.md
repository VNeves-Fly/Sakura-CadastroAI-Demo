# Lentidão em `/crm/agencias`, `/crm/executivos` e `/crm/gestores`

Medição feita rodando `next dev` local (banco + Valkey + SST reais, usuário
ADMIN autenticado via NextAuth), cronometrando a resposta HTTP completa de
cada rota com `curl -w time_total`. "Cache frio" = primeira carga da sessão
(TTL do cache de 10 min ainda não populado para essas chaves); "cache
quente" = segunda carga, dentro da janela de 10 min.

| Página            | Cache frio (real)                                                   | Cache quente (real) | Trava a tela toda?                                          |
| ----------------- | ------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------- |
| `/crm/agencias`   | **53,2s**                                                           | 0,57s (TTFB 0,21s)  | Não — skeleton imediato, conteúdo troca via Suspense        |
| `/crm/gestores`   | **18,4s**                                                           | 0,09s               | Não — skeleton imediato, seção de vendas troca via Suspense |
| `/crm/executivos` | **~18-20s estimado** (mesmo fan-out de `/crm/gestores`, ver abaixo) | 0,02s               | **Sim — tabela inteira em branco até tudo resolver**        |

`/crm/executivos` não tem Suspense: o shell da página responde em 0,03s,
mas a tabela fica vazia porque os dados vêm de um `fetch` client-side
bloqueante. Não consegui medir o tempo frio real desse `fetch` isoladamente
porque, na sequência de teste, `/crm/gestores` rodou primeiro e já tinha
aquecido o cache compartilhado (mesma função, mesmas chaves — ver seção
abaixo). A estimativa de ~18-20s vem do fato de ser **literalmente o mesmo
código, os mesmos 85 promotores, a mesma chamada ao SST** que `/crm/gestores`
mediu em 18,4s a frio.

## Causa raiz comum: fan-out de chamadas síncronas à SST

Duas das três páginas (`agencias` e `gestores`/`executivos`) abrem lento
porque, no carregamento, disparam dezenas/centenas de chamadas HTTP a um
serviço terceiro (SST) para montar métricas comerciais — e isso é
sequencial/limitado por necessidade, não por acidente: tentativas de
concorrência maior derrubam a maioria das conexões do lado da SST (comentado
no próprio código, ver abaixo).

---

## `/crm/agencias` — 53,2s a frio

**Página**: `src/app/(admin)/crm/agencias/page.tsx:22` (`carregarAgenciasCarteira`, disparado sem `await`, comentário nas linhas 17-21 já avisa: "em cache frio, podem levar dezenas de segundos").

**Causa**: `buscarTerrestreAgrupadoCarteira` em
`src/modules/agencias-crm/services/agencia-carteira.sst-service.ts:84-137`
pagina `/api/resumos/terrestre` (500 linhas/página) numa janela de 365 dias —
**~121 páginas**. A paginação usa
`mapComConcorrenciaLimitada` (`agencia-sst-client.util.ts:100-117`) com
**limite de 15 chamadas simultâneas** (`LIMITE_CONCORRENCIA_PAGINACAO = 15`,
linha 98) — comentário na linha 96 explica que 15 é o valor máximo testado
sem a SST travar conexões; ou seja, ~121 páginas ÷ 15 em voo ≈ **8 lotes
sequenciais**, cada um pagando round-trip + processamento. Depois disso,
`obterMetricasCarteira` (linhas 254-296) ainda agrega ~65 mil linhas em JS.

**Por que não trava a tela**: o `page.tsx` não dá `await` na promise — o
Suspense mostra `AgenciasListaSkeleton` na hora (TTFB rápido) e troca para o
conteúdo real quando os 53s terminam. A dor é real, mas é "a lista demora
quase um minuto pra aparecer", não "a página trava".

**Cache**: 10 min (Valkey + memória local), por isso a 2ª carga caiu para
0,57s.

**Adicional (só no fallback sem `SST_API_KEY`)**: `ListarCadastrosUseCase`
roda 10 queries `count()` separadas mesmo quando só `{ items }` é usado
(`agencia-carteira.loader.ts:76`), e `PrismaAgenciaRepository.listar` com
`todos: true` busca a tabela inteira sem paginação, com include pesado
(contratos, associação, executivo→gestor, evento). `Agencia.status`,
`razaoSocial` e `emailContato` não têm índice.

---

## `/crm/gestores` — 18,4s a frio (mitigado ontem, 2026-08-25)

**Página**: `src/app/(admin)/crm/gestores/page.tsx`.

**Causa**: `calcularVendasPorGestor`
(`src/modules/gestores/services/vendas-por-gestor.loader.ts:20-23`) roda
`Promise.all` sobre **todos os 85 promotores**, cada um chamando
`executivoDashboardController.obterVendasResumo(promotor.sica)` →
`buscarOverview` → 1 chamada a `/api/consolidado/overview` por promotor
(`executivo-dashboard.sst-service.ts:266-290`), sem limite de concorrência
(diferente do módulo de agências) — 85 chamadas simultâneas à SST.

**Por que não trava a tela (desde ontem)**: o comentário em
`vendas-por-gestor.loader.ts:13-19` confirma o problema e a correção: até
2026-08-25 essa promise era `await`ada dentro de `page.tsx`, travando a
página inteira em branco por "dezenas de segundos". Foi extraída para rodar
sem `await`, atrás de `Suspense`, só a seção de vendas
(`gestores-lista-secao.tsx`) espera por ela — mesmo padrão do `agencias`.

**Waterfall residual**: `GestoresView` refaz um fetch client-side
(`fetch("/api/gestores", { cache: "no-store" })`,
`src/modules/gestores/services/gestores.service.ts:18-24`) que já tinha sido
buscado no SSR — reexecuta `getServerSession` + `Gestor.findMany` sem
paginação uma segunda vez. Não é a causa dos 18s (isso é síncrono/rápido),
mas é uma requisição inteira redundante em toda navegação.

**Cache**: mesma chave/TTL de 10 min de `obterVendasResumo` — por isso a 2ª
carga caiu para 0,09s.

---

## `/crm/executivos` — o único caso que ainda trava a tela toda

**Página**: `src/app/(admin)/crm/executivos/page.tsx` — SSR só busca
`gestores`/`bases` (rápido). A lista de executivos vem de
`useEffect` → `fetch("/api/promotores", { cache: "no-store" })`
(`src/modules/atribuicoes/services/promotores-crud.service.ts:23`), **sem
Suspense, sem skeleton do lado servidor** — a tabela fica vazia até a
promise do client resolver.

**Rota**: `src/app/api/promotores/route.ts` →
`listPromotoresRoute()` em
`src/modules/atribuicoes/presentation/routes/promotores.routes.ts:50-59`:

```ts
async function comVendasReais(promotores) {
  const vendas = await Promise.all(
    promotores.map((promotor) => executivoDashboardController.obterVendasResumo(promotor.sica)),
  );
  ...
}
```

Isso é **exatamente a mesma função, os mesmos 85 promotores** que
`/crm/gestores` mediu em 18,4s a frio — mas aqui roda dentro de um único
fetch client bloqueante, sem streaming. Como o TTL de cache (10 min) é
compartilhado com `/crm/gestores` (mesma chave `exec:${sica}:overview:${data}`),
confirmei isso na prática: depois de abrir `/crm/gestores` (que aqueceu o
cache dos 85 promotores), `/api/promotores` respondeu em 0,33s em vez de
~18-20s — ou seja, hoje o tempo real de `/crm/executivos` **depende de qual
página o usuário abriu primeiro**, o que é um sintoma de acoplamento
acidental, não uma correção.

**Paginação cosmética**: a paginação de 25/página acontece no client,
**depois** que as 85 chamadas à SST já resolveram — não reduz o tempo de
carregamento, só o que é exibido.

**Sem cache no client**: `cache: "no-store"`, sem SWR/React Query — toda
navegação para `/crm/executivos` repete o fetch completo (mesmo dentro da
janela de cache do servidor, ainda precisa da viagem de rede
client→servidor→SST).

**Índices ausentes**: `Promotor.gestorId`, `Promotor.nome` não têm `@@index`
(`PrismaPromotorRepository.findAll()` não filtra nem pagina —
`prisma-promotor.repository.ts:31-35`).

---

## Verificação do commit `fa165de` ("usar dados da SST em vez do banco local para contagem de agência")

Esse commit só mudou `executivo-dashboard.sst-service.ts:757/763`, trocando
`roster.length` por `codigosEmpresa.length` no **dashboard individual**
`/crm/executivos/[id]`. Não toca nenhuma das três páginas de listagem e não
introduz chamada síncrona nova — não é a causa da lentidão medida aqui.

---

## Recomendação (prioridade)

1. **`/crm/executivos`** — aplicar o mesmo padrão de `/crm/gestores`:
   mover `comVendasReais` para trás de Suspense (ou pelo menos mostrar a
   tabela sem a coluna de vendas primeiro e streamar as vendas depois), em
   vez de bloquear o fetch inteiro. É a única das três páginas onde o
   usuário hoje vê uma tela vazia por ~18-20s a frio.
2. **`/crm/agencias`** — já está atrás de Suspense; se 53s a frio ainda for
   problema, o ganho está em reduzir as ~121 páginas de
   `/api/resumos/terrestre` (mesma ideia já aplicada em
   `docs/optimize.md` para `/crm/dashboard`: derivar contagens de janelas já
   buscadas por outro estágio, em vez de paginar de novo).
3. **`/crm/gestores`** — remover o refetch client-side redundante de
   `/api/gestores` já que o SSR busca os mesmos dados.
