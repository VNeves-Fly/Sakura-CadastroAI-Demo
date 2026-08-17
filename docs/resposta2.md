eu # Resposta ao `faltante2.md` — pendências verificadas no código do SST

Este documento responde às 3 "perguntas técnicas pro time do SST" listadas em
`docs/infos/faltante2.md`, conferidas direto contra o código-fonte deste
serviço. Duas delas (**1** e **2**) têm resposta definitiva sem precisar
perguntar a ninguém — a própria fonte já responde. A **3** foi confirmada
como realmente ausente. As "decisões de negócio internas" e o item
"Resolvido" do `faltante2.md` não são revistos aqui por não serem perguntas
de código.

---

## 1. Equivalente non-air do `resumo-agrupado` — não existe hoje, mas é construível

Confirmado: **não há** rota `/non-air/resumo-agrupado` em lugar nenhum do
projeto — só `/api/consolidado/air/resumo-agrupado` existe
(`consolidado.routes.ts:198`). Isso bloqueia mesmo `recencia`/
`recenciaDetalhe` e `cruzamentoCanais`/`cruzamentoDetalhe` pro lado
terrestre, como o time do front concluiu.

**Mas não é um "sabe-se lá só o SST responde" — é um item de engenharia de
escopo já conhecido**, porque as peças pra construir já existem no código:

- A versão aérea faz `MAX(b.dataemi) AS data_ultima_venda GROUP BY
v.codemp` (`consolidado.ts:178-205`, função
  `buildConsolidadoAirResumoAgrupadoSql`).
- O terrestre **tem os mesmos campos de data disponíveis**:
  `pub_sica.itemvend.dataemi` (SICA, dados até 2025) e
  `pub_sigot.filee.data` / `itpcfile` (SIGOT, dados a partir de 2026) — já
  usados em `buildNonAirSicaWhere` / `buildNonAirSigotWhere`
  (`consolidado.ts:239-240, 300-301`).
- O merge SICA/SIGOT por corte de data já existe como utilitário
  compartilhado: `selectTerrestreStrategy` (`terrestreStrategy.ts`, cutoff
  `2026-01-01`).
- O merge por agência entre fontes diferentes também já existe como padrão:
  `mergeClientePorClienteRows` (`topClientes.ts:194-213`), usado hoje pra
  juntar aéreo + terrestre por cliente.

**Conclusão:** replicar `buildConsolidadoAirResumoAgrupadoSql` pro par
SICA+SIGOT terrestre (usando os mesmos padrões de corte de data e merge já
usados em outros endpoints) resolve isso. Recomendação: tirar do balde
"pergunta técnica pro SST" e tratar como item de backlog de engenharia a
estimar — não depende de nenhuma informação que só o time do SST teria.

---

## 2. `/api/reports/saude-bases` — "agência ativa" já está definido no código

`saudeBase.ts:28-31`:

```sql
SUM(CASE WHEN e.ativo = 1 THEN 1 ELSE 0 END) AS agencias_ativas,
SUM(CASE WHEN e.ativo = 0 THEN 1 ELSE 0 END) AS agencias_inativas,
SUM(CASE WHEN e.bloqcred = 1 THEN 1 ELSE 0 END) AS agencias_bloqueadas,
SUM(CASE WHEN e.ativo = 1 AND e.bloqcred = 0 THEN 1 ELSE 0 END) AS agencias_operacionais
```

- `agencias_ativas` = flag de **cadastro habilitado** (`e.ativo = 1` em
  `pub_sica.empresa`) — é status de registro, não "vendeu recentemente".
- É independente de `bloqcred` (bloqueio de crédito), que gera a métrica
  separada e mais estrita `agencias_operacionais` (ativa **e** não
  bloqueada).
- Essa é a mesma tabela/campo (`pub_sica.empresa`, `e.ativo`, `e.bloqcred`)
  usada em `/api/reports/base-empresa-cadastro` (`empresaCadastro.ts`) — as
  duas fontes são consistentes entre si, mesmo registro de origem.

**Conclusão pra `conversao`/`saudePct`:** dá pra usar `agencias_ativas`
somado de todas as filiais do `saude-bases` como **denominador** (total de
carteira ativa), sem precisar perguntar ao time do SST. O que falta pra
fechar a métrica é só o **numerador** (quantas dessas agências ativas
venderam nos últimos 30 dias) — que depende do item 1 acima pro lado
terrestre (pro lado aéreo já dá pra derivar do `resumo-agrupado` existente).

---

## 3. Total Filial+Representante já somado — confirmado que não existe

Reconferido em todos os endpoints que aceitam `painel`: nenhum tem opção de
soma pronta. `painel=AMBOS` sempre devolve `{filial, representante}` lado a
lado, nunca consolidado (`consolidado.routes.ts:578, 635` — já documentado
em `resposta.md`). Essa pergunta pro SST é válida e continua em aberto: hoje
a única forma é somar `filial.*` + `representante.*` no client depois de
chamar com `painel=AMBOS`, ou pedir um campo novo na API.

---

## Fora de escopo desta verificação (não são perguntas de código)

- As 5 "decisões de negócio internas" do `faltante2.md` (painel do
  `/overview`, `situacao`, janela mês/ano, algoritmo de projeção, onde
  hospedar o cron de snapshot) continuam sendo decisão de produto/
  arquitetura — não têm resposta no código-fonte.
- O item "Resolvido" (mapa IATA/código→nome) — conferido: o arquivo
  `src/lib/companhiasAereas.ts` do CRM antigo, citado em
  `docs/infos/CRM.md:261` como fonte do mapa `SIGLA_TO_NOME`, **não existe
  neste repositório nem em nenhum lugar acessível daqui** — só a referência
  textual no doc. A conclusão do front de "sem fonte disponível, deixar como
  está" está correta; a sugestão anterior (`resposta.md`) de portar esse mapa
  partia de um arquivo que não está de fato acessível.
