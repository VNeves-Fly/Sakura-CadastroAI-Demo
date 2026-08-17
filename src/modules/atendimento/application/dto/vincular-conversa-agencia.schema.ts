import { z } from "zod";

export const vincularConversaAgenciaSchema = z.object({
  agenciaId: z.string().min(1, "Selecione uma agência."),
  representanteLegalId: z.string().nullable(),
  membroNome: z.string().min(1, "Informe o nome do contato."),
  membroPapel: z.enum(["socio", "representante_legal", "comercial", "outro"]),
});
