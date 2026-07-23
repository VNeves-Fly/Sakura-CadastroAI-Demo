import { z } from "zod";

export const enviarMensagemSchema = z.object({
  tipo: z.enum(["texto", "audio", "imagem", "pdf"]),
  conteudo: z.string().min(1, "Conteúdo é obrigatório."),
  duracaoSegundos: z.number().int().positive().optional(),
  tamanhoArquivo: z.string().optional(),
});
