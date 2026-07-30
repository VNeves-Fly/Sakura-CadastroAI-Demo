import { z } from "zod";

export const solicitarTransferenciaAtendimentoAgenciaSchema = z.object({
  paraAnalistaId: z.string().min(1, "Escolha um analista pra transferir."),
});
