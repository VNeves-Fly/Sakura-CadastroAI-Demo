import { z } from "zod";

export const atualizarTemplateMetadataSchema = z.object({
  titulo: z.string().trim().min(1, "Título não pode ser vazio.").nullable().optional(),
  ativo: z.boolean().optional(),
});
