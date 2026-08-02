-- Unificação de atendimento (2026-07-30): chat e cadastro compartilham a
-- mesma base (AtendimentoAgencia/SolicitacaoAtendimentoAgencia, chave
-- agenciaId). As duas tabelas do chat abaixo já tiveram seu histórico
-- migrado (11 + 1 linhas) via scripts/importar-historico-atendimento.mjs
-- antes desta migração rodar — ver docs/bkp/*.csv pro backup original.
-- DROP TABLE já derruba junto os triggers/índices/FKs que dependem delas
-- (trg_notify_assumir_atendimento, trg_notify_solicitacoes_transferencia).

-- DropTable
DROP TABLE "assumir_atendimento_registros";

-- DropTable
DROP TABLE "solicitacoes_transferencia";

-- DropEnum
DROP TYPE "StatusSolicitacaoTransferencia";
