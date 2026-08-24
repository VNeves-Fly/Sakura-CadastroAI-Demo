// Espelha o enum DisparoEmail do schema.prisma como union type puro, sem
// depender do client gerado no domínio (mesma convenção de
// cadastro/domain/enums.ts).
export type DisparoEmail = "manual" | "automatico";
