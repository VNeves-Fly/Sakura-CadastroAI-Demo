import { z } from "zod";

export const criarEventoLinkSchema = z.object({
  eventoId: z.string().min(1, "eventoId é obrigatório."),
  promotorId: z.string().min(1).nullable().default(null),
  associacaoId: z.string().min(1).nullable().default(null),
});

export type CriarEventoLinkInput = z.infer<typeof criarEventoLinkSchema>;

export const criarEventoSchema = z.object({
  nome: z.string().min(1, "Informe o nome do evento."),
});
