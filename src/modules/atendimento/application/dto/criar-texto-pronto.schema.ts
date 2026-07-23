import { z } from "zod";

export const criarTextoProntoSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório."),
  conteudo: z.string().min(1, "Conteúdo é obrigatório."),
});
