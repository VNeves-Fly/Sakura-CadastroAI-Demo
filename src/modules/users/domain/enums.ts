// Espelha o enum Cargo do schema.prisma como union type puro, sem depender
// do @prisma/client — mantém o domínio livre de framework (ver
// src/modules/cadastro/domain/enums.ts pro mesmo padrão).
export type Cargo = "ADMIN" | "DIRETOR_ANALISTA" | "ANALISTA" | "GESTOR" | "EXECUTIVO";
