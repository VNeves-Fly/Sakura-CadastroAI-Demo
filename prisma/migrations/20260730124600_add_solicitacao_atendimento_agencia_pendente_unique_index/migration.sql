-- Só um pedido PENDENTE por agência ao mesmo tempo — fecha a corrida de 2
-- pedidos quase simultâneos (ex.: dois analistas clicando "Assumir" quase
-- juntos). Índice único PARCIAL: não existe equivalente no schema.prisma
-- (Prisma não expressa índice condicional), então "prisma db pull"/
-- introspecção não reproduz isso — NÃO remover numa migração futura gerada
-- automaticamente a partir de diff de schema.
CREATE UNIQUE INDEX "solicitacao_atendimento_agencia_pendente_unica"
  ON "solicitacoes_atendimento_agencia" ("agenciaId")
  WHERE "status" = 'PENDENTE';
