import { z } from "zod";

export const responderTransferenciaSchema = z.object({
  aceita: z.boolean(),
});
