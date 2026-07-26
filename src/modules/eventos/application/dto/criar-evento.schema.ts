import { z } from "zod";

export const criarEventoSchema = z.object({
  nome: z.string().min(1, "Informe o nome do evento."),
  slug: z.string().trim().min(1).nullable().optional(),
});
