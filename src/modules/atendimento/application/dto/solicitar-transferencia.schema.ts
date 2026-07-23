import { z } from "zod";

export const solicitarTransferenciaSchema = z.object({
  paraAnalista: z.string().min(1, "Escolha um analista pra transferir."),
});
