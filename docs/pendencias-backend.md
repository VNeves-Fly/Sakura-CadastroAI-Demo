# Pendências do backend

## 1. Mock de `CadastrosKpis` desatualizado no teste de `listar-cadastros`

`__tests__/modules/cadastro/application/use-cases/listar-cadastros.use-case.test.ts:15` declara um `KPIS_VAZIOS: CadastrosKpis` que não inclui o campo `aguardandoAssinaturaPorOrigem` (adicionado em `agencia-repository.ts` pra alimentar o hover do card "Aguardando assinatura" com o breakdown IA x analista). Isso quebra o `bun run typecheck`.

Falta: adicionar `aguardandoAssinaturaPorOrigem: { ia: 0, humano: 0 }` no objeto `KPIS_VAZIOS`.

## 2. Erros de tipo pré-existentes em `prisma-template-whatsapp.repository.ts`

`bun run typecheck` acusa 7 erros nesse arquivo (`ativo`/`titulo` não existem no tipo esperado pelo Prisma Client, incompatibilidade de shape entre o `select` da query e o record repassado pro mapeamento pra `TemplateAprovadoEntity`). Confirmado via `git stash` que já existiam antes de qualquer mudança desta sessão — não relacionado ao trabalho de cores dos cards de `/cadastros`.

Falta: investigar se o schema Prisma (campos `ativo`/`titulo` do model de template WhatsApp) está dessincronizado do client gerado (rodar `prisma generate`?) ou se o `select`/mapeamento do repositório precisa ser ajustado pros campos reais do model.
