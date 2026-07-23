import { DomainError } from "@/modules/shared/domain/errors";

// Meta error code 131047 — mensagem de texto livre fora da janela de 24h;
// só um template aprovado pode ser enviado. Ver
// infrastructure/adapters/meta-whatsapp.adapter.ts.
export class ForaDaJanela24hError extends DomainError {
  constructor() {
    super("Janela de atendimento de 24h fechada — envie um template aprovado pela Meta.");
    this.name = "ForaDaJanela24hError";
  }
}
