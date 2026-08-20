# Backend necessário para o Dashboard do Gestor (`/crm/gestores/:id`)

Levantamento do que o backend precisa entregar pra substituir o mock de `src/modules/gestores/adapters/gestor-detalhe.adapter.ts` (`montarGestorPerfil` + `montarGestorDashboard`) por dados reais, sem quebrar o contrato que o front já consome.

> Front-end de referência: `src/modules/gestores/types/gestor-detalhe.types.ts` (contrato, `GestorDetalheView`), `adapters/gestor-detalhe.adapter.ts` (todo número mock, gerado por `hashParaNumero(gestor.id)`, determinístico).
>
> Esta página é **o mesmo domínio de `docs/mock-exec.md` e `docs/crm-backend.md`, só agregado um nível acima**: em vez de filtrar `Venda` por `agenciaId IN (agências de 1 executivo)`, filtra por `agenciaId IN (agências de todos os executivos com Promotor.gestorId = este gestor)`. É a mesma tabela `Venda`/`Fornecedor` proposta em `docs/crm-backend.md §3` — não criar nada novo, só variar o agrupamento/filtro da query. **Ler `docs/mock-exec.md` primeiro** — quase todo campo daqui tem o par exato lá, e não repito a fórmula/decisão quando é idêntica.

---

## 1. Já é real hoje (não precisa mudar)

| Campo                                                          | Fonte                                                                            |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `perfil.id`, `.nome`, `.email`, `.telefone`, `.bases`          | `Gestor`                                                                         |
| `perfil.basePrincipal`                                         | = `bases[0]`                                                                     |
| `perfil.totalExecutivos`                                       | `COUNT(Promotor.gestorId = gestor.id)`                                           |
| `perfil.totalAgencias`                                         | `SUM` de agências de cada executivo subordinado (`Agencia.executivoId IN (...)`) |
| `dashboard.crossCanal.aprovadas`                               | = `perfil.totalAgencias`                                                         |
| `dashboard.hero.executivosAtivos`                              | = `perfil.totalExecutivos`                                                       |
| Nome/CNPJ de agências citadas em rankings/ações prioritárias   | `Agencia.razaoSocial`/`.cnpj`                                                    |
| `acoesPrioritarias.*.base`                                     | `executivo.bases[0]` (do executivo dono da agência)                              |
| Nome de cada executivo em `topExecutivosMelhorSaude`/`Atencao` | `Promotor.nome`                                                                  |

Tudo o resto é **mock determinístico** — as fórmulas de venda/saúde/cross-canal são estruturalmente as mesmas de `docs/mock-exec.md`, só somadas na carteira inteira do gestor em vez de um executivo só.

---

## 2. Campos exclusivos desta página (não existem em `/crm/executivos/:id`)

### `perfil`

| Campo           | Fórmula mock atual                                                                  | O que precisa vir real                                                                                                                                                                                                                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identificador` | Slug `"GEST-" + primeira palavra do nome` (ex.: "SAKURA Comercial" → "GEST-SAKURA") | **Decisão de produto**: vale a pena um identificador único de verdade (tipo o `sica` do executivo), ou o slug do nome é aceitável como definitivo? Se sim, não é "mock a substituir" — é regra de UI, pode ficar como está                                                                                                                   |
| `ativo`         | `hashParaNumero(gestor.id) % 10 !== 0` (~90% ativo, sorteado)                       | **Bloqueado**: `Gestor` não tem campo de status hoje. Precisa de migration (`ativo: Boolean` ou similar) — igual ao padrão que `Promotor.ativo` já tem                                                                                                                                                                                       |
| `nivel`         | `nivelSeed(gestor.id)` — hash determinístico entre as 4 opções de `GestorNivel`     | **Decisão já tomada pelo usuário (2026-08-17): não fazer migration ainda.** O nível real vive só em `localStorage` (`gestor-niveis.store.ts`) pra gestores cadastrados pelo fluxo novo; o seed é só fallback visual pra não deixar a coluna vazia em gestores antigos. Não tratar como "mock a corrigir" sem confirmar se essa decisão mudou |

### `dashboard.hero.meta` (`MetaMes`)

| Campo                              | Fórmula mock atual                                                                                                                                                                                                               | O que precisa vir real                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `valor` (meta do mês)              | **Calculado de trás pra frente**: sorteia `percentualAtingido` (20~75%) e deriva `metaValor = valorMesAtual / (percentualAtingido / 100)` — ou seja, a "meta" não é uma meta real, é maquiada pra caber num percentual aleatório | **Não existe conceito de meta/quota no schema hoje**, nem pro executivo nem pro gestor. Precisa de decisão de produto: quem define a meta (gestor define a do executivo? diretoria define a do gestor?), periodicidade, e um model novo (ex.: `MetaComercial { gestorId/promotorId, mes, valor }`) — **este é o maior gap novo desta página**, não tem equivalente em `docs/mock-exec.md` |
| `percentualAtingido`, `faltaValor` | Deriváveis de `valor real / meta.valor`                                                                                                                                                                                          | Derivável no front **depois** que a meta real existir — não é um dado a "buscar", é consequência do bloqueio acima                                                                                                                                                                                                                                                                        |
| `projecaoFimMes`                   | Igual ao `kpis.projecaoFimMes` — mesmo bloqueio de algoritmo de projeção já listado em `docs/crm-backend.md §4.3`/`docs/mock-exec.md §2`                                                                                         | —                                                                                                                                                                                                                                                                                                                                                                                         |

### `dashboard.kpis.mesAnteriorMesReferencia`

Só o nome do mês anterior formatado (`"jul/26"`) — 100% derivável no front a partir da data atual, **não é mock de dado, não precisa de backend**.

### `dashboard.vendasMensaisNacionalPct` / `InternacionalPct`

Derivável no front a partir da série `vendasMensais` real (`nacional / (nacional + internacional)`) — **não precisa vir pronto**, mesma lógica de `vendasMensaisVariacaoAltaPct` em `docs/mock-exec.md`.

### `dashboard.topExecutivosMelhorSaude` / `topExecutivosAtencao`

| Campo                                    | Fórmula mock atual                                                                                 | O que precisa vir real                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vendendo`, `total`, `pct` por executivo | Por executivo: `total = agencias.length` (real), `vendendo = total * hash(executivo.id) aleatório` | `COUNT(DISTINCT agenciaId)` com venda nos últimos 30d, por `executivoId`, dentro da carteira de cada executivo subordinado — é o mesmo dado de `perfil.vendendoUltimos30d` do `docs/mock-exec.md`, só que **por executivo** em vez de agregado. `topExecutivosMelhorSaude` = 5 maiores `pct`, `topExecutivosAtencao` = 5 menores `pct` — ordenação é derivável no front, só o `pct` real precisa vir do backend |

### `dashboard.acoesPrioritarias` (`paradasComHistorico` + `emQueda`)

Estrutura idêntica a `dashboard.paradasComHistorico`/`emQueda` de `docs/mock-exec.md`, com um campo extra: `base` (a base do executivo dono da agência — já real, ver seção 1). Mesmas fórmulas/decisões pendentes (threshold de "parada" e de "queda") descritas lá.

---

## 3. Campos com o mesmo par em `docs/mock-exec.md` (fórmula idêntica, só a granularidade muda)

Estes seguem **exatamente** a mesma fórmula mock e a mesma necessidade de backend do dashboard do executivo — a única diferença é que aqui a agregação roda sobre `agenciaId IN (todas as agências de todos os executivos do gestor)` em vez de um executivo só:

- `perfil.vendendoUltimos30d` / `Pct`
- `dashboard.hero.valor` / `.bilhetes` / `.agenciasVendendo` / `.variacaoPct`
- `dashboard.kpis.mesAnteriorValor` / `.acumuladoAnoValor` / `.acumuladoAnoBilhetes` / `.ticketMedio30d`
- `dashboard.vendasMensais` (série nacional/internacional/terrestre)
- `dashboard.tendencia30d` / `.tendencia30dTotal`
- `dashboard.crossCanal` (ativas/aereo/terrestre/soAereo/soTerrestre/ambos)
- `dashboard.saudeCarteira` (ativas/potenciais/ociosas/inativas) — **mesmo bloqueio de "limite de crédito comercial"** apontado em `docs/mock-exec.md §3.1`, propagado aqui também
- `dashboard.topAgenciasMes` / `topAgenciasAno`

Não vou reduplicar a tabela campo-a-campo — ver `docs/mock-exec.md §2` pra fórmula exata de cada um.

---

## 4. Decisões de negócio novas (além das já listadas em `docs/crm-backend.md §4` e `docs/mock-exec.md §3`)

1. **Meta/quota comercial não existe no schema** — bloqueia `hero.meta` inteiro (o maior gap desta página, sem equivalente no dashboard do executivo). Precisa de definição de produto antes de qualquer modelagem: quem define a meta, em que nível (gestor? executivo? agência?), qual periodicidade.
2. **Status `ativo` do Gestor** não existe — decisão simples (`ativo: Boolean` como em `Promotor`), mas é migration nova, então precisa aprovação antes de rodar.
3. **`nivel` do Gestor é decisão já tomada de ficar fora do banco** (2026-08-17) — só documentando aqui pra não ser confundido com "mock esquecido" numa varredura futura.
4. **Ranking de executivos por saúde** (`topExecutivosMelhorSaude`/`Atencao`) depende da mesma decisão #2 de `docs/mock-exec.md` (janela de "vendendo nos últimos 30d") — mas agora replicada por executivo, então qualquer mudança na janela precisa valer pra ambas as páginas ao mesmo tempo (senão os números do gestor não somam com os dos executivos individuais).

---

## 5. Contrato de dados (shape que o backend precisa alimentar)

```ts
type GestorDetalheView = {
  perfil: GestorPerfil; // ver types/gestor-detalhe.types.ts:11
  dashboard: GestorDashboard; // ver types/gestor-detalhe.types.ts:115
};
```

Mesma filosofia das outras duas páginas: um único `GestorDetalheController.buscarDetalhe(gestorId)` chamado direto do `page.tsx`, sem fatiar em N endpoints. O front hoje já separa `montarGestorPerfil` (leve, usado pelas 4 abas) de `montarGestorDashboard` (pesado, só a aba Dashboard) — vale manter essa separação em 2 métodos/queries no backend real, pra não recalcular o dashboard inteiro só pra renderizar o header nas abas Executivos/Agenda/Agências.

---

## 6. Checklist pra destravar a implementação

- [ ] Tudo do checklist de `docs/mock-exec.md` §5 — é pré-requisito direto (mesma tabela `Venda`/`Fornecedor`, mesmo bloqueio de limite de crédito).
- [ ] Decidir o modelo de meta/quota comercial (seção 4, item 1) — bloqueia `hero.meta` sem alternativa de "derivar no front".
- [ ] Aprovar migration de `Gestor.ativo` (seção 4, item 2), se for pra sair do mock.
- [ ] Confirmar que a janela de "vendendo últimos 30d" fica igual entre executivo e gestor (seção 4, item 4) — evita números que não conferem entre as duas páginas.
- [ ] Implementar a query de `topExecutivosMelhorSaude`/`Atencao` agrupando `Venda` por `executivoId` dentro da carteira do gestor.
