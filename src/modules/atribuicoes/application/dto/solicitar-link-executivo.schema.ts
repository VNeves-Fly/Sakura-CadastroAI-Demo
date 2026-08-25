import { z } from "zod";

export const solicitarLinkExecutivoSchema = z.object({
  email: z.string().trim().email("E-mail inválido."),
});

export type SolicitarLinkExecutivoSchema = z.infer<typeof solicitarLinkExecutivoSchema>;
