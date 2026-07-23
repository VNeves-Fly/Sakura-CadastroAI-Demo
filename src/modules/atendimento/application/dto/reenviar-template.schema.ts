import { z } from "zod";

export const reenviarTemplateSchema = z.object({
  novoConteudo: z.string().min(1, "Conteúdo é obrigatório."),
});
