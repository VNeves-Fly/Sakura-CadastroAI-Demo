import { z } from "zod";

export const createBaseSchema = z.object({
  sigla: z
    .string()
    .min(2, "Sigla deve ter ao menos 2 caracteres.")
    .max(4, "Sigla deve ter no máximo 4 caracteres.")
    .transform((valor) => valor.toUpperCase()),
  nomeCidade: z.string().min(2, "Nome da cidade deve ter ao menos 2 caracteres."),
  uf: z
    .string()
    .length(2, "UF deve ter 2 letras.")
    .transform((valor) => valor.toUpperCase()),
});

export type CreateBaseSchema = z.infer<typeof createBaseSchema>;
