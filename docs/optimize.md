# `/dashboard-new` — reduzir chamadas redundantes ao SST

**Status: implementado** (pontos 2 e 3 abaixo) — ver
`dashboard-vendas.sst-service.ts` e os testes novos em
`dashboard-vendas.sst-service.test.ts`.

O dashboard-new carrega em um waterfall sequencial de 6 estágios
(`resumoEDia → projecao → recenciaECruzamento → conversao → vendasMensais →
vendasDiarias`, ver `dashboard-vendas-view.tsx:50-67`, cada um esperando o
anterior terminar via `depoisDe()` — proposital, ver comentário em
`sst-service.ts:221-227` sobre 5xx do SST sob concorrência). Numa análise dos
valores buscados por cada estágio, identifiquei 3 categorias de dado
reaproveitado entre estágios:

1. `totalAgenciasAtivas()` chamada 2x sem cache (`construirConversao` e
   `construirCruzamento`) — duplicata real e trivial de resolver, endereçada
   à parte.
2. `nacint`/`nonair` do mês corrente, reaproveitados só por coincidência de
   timing.
3. `codigosAgenciasAereo`/`codigosAgenciasTerrestre` recalculando o que
   `recenciaECruzamento` (estágio anterior) já buscou.

Este documento aprofunda os pontos 2 e 3 — o objetivo é encurtar o estágio
mais pesado do waterfall (`conversao`), que hoje pagina `/api/resumos/
terrestre` **3 vezes** (30d, mês corrente, mês anterior) além do que
`recenciaECruzamento` já paginou para 90 dias. Menos requisições paginadas =
menos tempo nesse estágio = página abre mais rápido, e menos concorrência no
SST.

## Ponto 2 — `nacint`/`nonair` do mês corrente reaproveitados entre estágios

**O que acontece:** `obterResumoEDia` (estágio 1) e o último item do loop de
`construirVendasMensais` (estágio 5, quando o mês do loop é o corrente) pedem
o mesmo intervalo (`inícioMês → hoje`) pro `nacional-vs-internacional`. O
mesmo vale pro `non-air` entre `construirConversao` (estágio 4) e
`construirVendasMensais` (estágio 5).

**Correção durante a implementação — o `nacint` era uma duplicata real, não
só um risco de timing:** a suspeita original era que `comCache` (TTL 10 min,
L1 Map + L2 Valkey) já deduplicava as duas chamadas por chave exata, sobrando
só o risco de quebrar se o waterfall deixasse de ser sequencial. Um teste
escrito pra só documentar esse comportamento (chamando os estágios na ordem
real e contando `fetch`) **revelou que a chamada de `nacint` duplicava de
verdade, hoje** — `obterResumoEDia` chamava `sstGet` **direto**, sem passar
por `buscarNacInt`/`comCache` (diferente de `construirConversao`, que já usa
`buscarNonAir`/`comCache` pro lado `non-air`). Resultado: o `nonair` já
reaproveitava corretamente, mas o `nacint` do mês corrente sempre batia 2x no
SST, independente de ordem.

**Correção aplicada:** `obterResumoEDia` (`sst-service.ts`) agora usa
`buscarNacInt(inicioMes, hoje)`/`buscarNacInt(inicioAno, hoje)` em vez de
`sstGet` direto — mesma função já usada por `construirVendasMensais` e
`construirProjecaoReal`. Isso faz as duas chamadas do mês corrente convergirem
pro mesmo `comCache`, eliminando a chamada duplicada de verdade (não só
protegendo contra uma duplicata hipotética futura).

**Guardrail adicionado:** teste
`"reaproveita nacint/nonair do mês corrente entre estágios sequenciais"` em
`dashboard-vendas.sst-service.test.ts` — chama `obterResumoEDia` →
`obterConversao` → `obterVendasMensais` na mesma ordem da view real e conta,
via `global.fetch` mockado, quantas vezes `nacional-vs-internacional` e
`non-air` foram chamados com `startDate=inícioMês&endDate=hoje`, esperando
**1** cada. Esse teste teria pego a duplicata original e passa a proteger
contra qualquer regressão futura (inclusive se alguém paralelizar os
estágios).

## Ponto 3 — `codigosAgenciasAereo`/`codigosAgenciasTerrestre` recalculam o que `recenciaECruzamento` já buscou

**O problema:** `construirConversao` (estágio 4) chama
`contarAgenciasAtivasAmbos` 3 vezes (linhas 706-708, para 30 dias, mês
corrente e mês anterior). Cada chamada dispara:

- `codigosAgenciasAereo(inicio, fim)` → 1 chamada a
  `/api/consolidado/air/resumo-agrupado`
- `codigosAgenciasTerrestre(inicio, fim)` → pagina `/api/resumos/terrestre`
  do zero (500/página)

`recenciaECruzamento` (estágio 3, que roda logo antes) já buscou:

- `buscarAereoJanela(365)` (linha 947) → `Map<codigo, {ultima, ...}>` para os
  últimos 365 dias
- `buscarTerrestreJanela(90)` (linha 948) → mesmo shape, últimos 90 dias,
  **paginação completa**

Como 90 dias sempre cobre "30 dias atrás→hoje" e "início do mês→hoje" (nunca
mais que 31 dias), e 365 dias cobre os mesmos casos para aéreo, dá para
responder "essa agência vendeu nesse intervalo?" olhando só o campo `ultima`
(data da venda mais recente) de quem já foi buscado — **sem nova chamada ao
SST** — para 2 das 3 janelas de cada canal.

**Por que a janela "mês anterior" não dá para derivar:** ela não termina em
"hoje" (termina num mês passado). Se a venda mais recente de uma agência for
depois do fim do mês anterior, o campo `ultima` não revela se ela também
vendeu _dentro_ do mês anterior — só sabemos a venda mais recente, não o
histórico completo. Essa janela continua precisando de uma chamada/paginação
real (aéreo: 1 chamada; terrestre: pagina de novo).

**Ganho esperado:** de 3 paginações completas de `/resumos/terrestre` em
`conversao`, cai para 1 (só a de "mês anterior"). Isso é a maior fonte de I/O
do estágio `conversao` — o comentário do próprio código já diz que paginação
concorrente de terrestre é o que historicamente estourou o retry de 5xx do
SST (`sst-service.ts:221-227`), então isso também reduz risco de falha, não
só tempo.

### Implementação (tudo em `dashboard-vendas.sst-service.ts`)

1. Adicionar uma função auxiliar que tenta derivar o `Set<number>` de uma
   janela já cacheada, checando primeiro o `Map` L1 (`cacheConsolidado`) e,
   se ausente/expirado, o Valkey L2 via `valkeyGet` (o serializador em
   `valkey-cache.util.ts:42-58` já preserva `Map`/`Set` corretamente, então
   isso funciona entre instâncias do Cloud Run também):

   ```ts
   async function tentarDerivarDeJanela(
     chaveJanela: string,
     corte: string,
   ): Promise<Set<number> | undefined> {
     const cacheado = cacheConsolidado.get(chaveJanela);
     const mapa =
       cacheado && cacheado.expiraEm > Date.now()
         ? (cacheado.valor as Map<number, DadosPorAgencia>)
         : await valkeyGet<Map<number, DadosPorAgencia>>(chaveJanela);
     if (!mapa) return undefined;
     const codigos = new Set<number>();
     for (const [codigo, dados] of mapa) {
       if (dados.ultima >= corte) codigos.add(codigo);
     }
     return codigos;
   }
   ```

2. Em `codigosAgenciasAereo(inicio, fim)` (linha 411-420): antes do
   `comCache` existente, se `fim === hojeIso()`, tentar
   `tentarDerivarDeJanela(`aereo-janela:${JANELA_AEREO_RECENCIA_DIAS}:${hoje}`, inicio)`.
   Se vier um `Set`, retornar direto. Senão, cair no `comCache` de sempre
   (comportamento idêntico ao atual).

3. Mesma coisa em `codigosAgenciasTerrestre(inicio, fim)` (linha 433-459),
   usando a chave `terrestre-janela:${JANELA_TERRESTRE_RECENCIA_DIAS}:${hoje}`.

4. Nenhuma mudança em `contarAgenciasAtivasAmbos`, `construirConversao`,
   `construirAgenciasComputadas`, no controller, no adapter ou em qualquer
   componente — o atalho fica encapsulado dentro das duas funções, então o
   shape de retorno de tudo que consome (`Conversao`, testes, adapter)
   continua idêntico.

**Por que essa abordagem preserva o isolamento de falha existente:** se
`recenciaECruzamento` falhar ou cair no mock (`comFallback`), a janela nunca
é cacheada com sucesso — `tentarDerivarDeJanela` simplesmente não encontra
nada e `codigosAgenciasAereo`/`codigosAgenciasTerrestre` caem no fetch direto
de sempre. Mesmo raciocínio para os testes: `obterDashboard()` roda
`obterConversaoComFallback` e `obterRecenciaECruzamentoComFallback` em
`Promise.all` (linhas 1334-1342) — nos testes atuais isso significa que o
atalho normalmente **não** vai disparar (execução concorrente, cache ainda
não populado), então os testes existentes continuam passando exatamente como
hoje, sem precisar de nenhum ajuste. No fluxo real da página
(`dashboard-vendas-view.tsx`), como os estágios são sequenciais, o atalho vai
disparar de verdade.

### Teste adicionado

Em `dashboard-vendas.sst-service.test.ts`, teste
`"deriva codigosAgenciasAereo/Terrestre de janelas que terminam hoje..."`:
chama `obterRecenciaECruzamento()` e **depois** `obterConversao()` na mesma
execução (não via `obterDashboard()`, que roda em paralelo e por isso nunca
aciona o atalho — ver explicação acima) e verifica, via contagem de chamadas
do `global.fetch` mock, que depois de `recenciaECruzamento` só sobra **1**
chamada nova a `/api/resumos/terrestre` e **1** a
`/api/consolidado/air/resumo-agrupado` (a de "mês anterior" — 30d e mês
corrente vieram da derivação). Também confirma que
`conversao.ambos.saudePct` bate com a união calculada a partir da janela
(`{1,3}` nas fixtures do teste, não mais o `{1,2,3}` que a fixture antiga
"enxergava" porque o mock de teste não filtra por data — a derivação real
filtra por `ultima >= corte`, então é mais precisa que o fetch direto
simulado no teste).

## Verificação

1. `npx tsc --noEmit` — sem erros.
2. `npx eslint src/modules/dashboard-vendas/services/dashboard-vendas.sst-service.ts __tests__/modules/dashboard-vendas/services/dashboard-vendas.sst-service.test.ts` — sem erros.
3. `npx jest __tests__/modules/dashboard-vendas` — 26 testes passando (18 do
   sst-service, incluindo os 2 novos, + 8 do projecao.util).
4. Próximo passo manual (não feito nesta rodada): rodar `/crm/dashboard-new`
   localmente (usuário ADMIN) com `VALKEY_URL` configurada e observar nos
   logs/network do SST que o estágio `conversao` faz menos requisições a
   `/api/resumos/terrestre` e `/api/consolidado/nacional-vs-internacional`
   do que antes.
