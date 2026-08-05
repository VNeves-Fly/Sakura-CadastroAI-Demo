import { z } from "zod";

export const createAssociacaoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres."),
  ativo: z.boolean().default(true),
});

export type CreateAssociacaoSchema = z.infer<typeof createAssociacaoSchema>;
