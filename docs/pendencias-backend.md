# Pendências do backend

Nenhuma pendência em aberto no momento — `bun run typecheck` limpo. Histórico do que já foi resolvido:

## 1. ~~Mock de `CadastrosKpis` desatualizado no teste de `listar-cadastros`~~ (resolvido)

`__tests__/modules/cadastro/application/use-cases/listar-cadastros.use-case.test.ts:15` declarava um `KPIS_VAZIOS: CadastrosKpis` sem o campo `aguardandoAssinaturaPorOrigem` (adicionado em `agencia-repository.ts` pra alimentar o hover do card "Aguardando assinatura" com o breakdown IA x analista). Corrigido adicionando `aguardandoAssinaturaPorOrigem: { ia: 0, humano: 0 }` no objeto.

## 2. ~~Erros de tipo em `prisma-template-whatsapp.repository.ts`~~ (resolvido)

`bun run typecheck` acusava 7 erros nesse arquivo (`ativo`/`titulo` ausentes no tipo do Prisma Client). Causa: a migration `20260729120153_add_titulo_ativo_template_whatsapp` já tinha rodado no banco, mas o client gerado (`node_modules/@prisma/client`) era anterior a ela — `$TemplateWhatsAppPayload` não incluía os dois campos novos. Resolvido rodando `bun run db:generate` (`prisma generate`).
