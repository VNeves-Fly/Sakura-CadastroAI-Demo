import { z } from "zod";

export const iniciarConversaSchema = z.object({
  agenciaId: z.string().min(1, "agenciaId é obrigatório."),
  telefoneWhatsapp: z.string().min(1, "telefoneWhatsapp é obrigatório."),
  representanteLegalId: z.string().nullable(),
  membroNome: z.string().nullable(),
  membroPapel: z.enum(["socio", "representante_legal", "comercial", "outro"]),
});
