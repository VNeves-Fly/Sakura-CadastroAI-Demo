import { z } from "zod";

export const criarTemplateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório."),
  conteudo: z.string().min(1, "Conteúdo é obrigatório."),
  categoria: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]),
  idioma: z.string().min(1, "Idioma é obrigatório."),
});
