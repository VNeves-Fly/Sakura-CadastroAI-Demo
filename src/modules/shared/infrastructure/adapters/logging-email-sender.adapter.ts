import type { EmailInput, EmailSender } from "@/modules/shared/domain/services/email-sender";
import type { EmailLogRepository } from "@/modules/shared/domain/repositories/email-log-repository";

// Decorator transparente — envolve o EmailSender real (Smtp/Console) e
// registra todo envio em EmailLog, sem mudar o contrato da interface nem
// o comportamento pro caller: continua lançando em falha (cada call-site
// já decide sozinho se isso é best-effort ou não), só passa a também
// deixar rastro em banco em vez de só console.warn/error. Ver
// createEmailSender (ponto único que aplica este decorator).
export class LoggingEmailSender implements EmailSender {
  constructor(
    private readonly delegate: EmailSender,
    private readonly emailLogRepository: EmailLogRepository,
  ) {}

  async send(input: EmailInput): Promise<void> {
    let erro: string | undefined;

    try {
      await this.delegate.send(input);
    } catch (error) {
      erro = String(error);
      throw error;
    } finally {
      try {
        await this.emailLogRepository.create({
          destinatario: input.to,
          assunto: input.subject,
          corpo: input.html,
          origem: input.meta.origem,
          disparo: input.meta.disparo,
          agenciaId: input.meta.agenciaId,
          sucesso: erro === undefined,
          erro,
        });
      } catch (logError) {
        console.error(
          `LoggingEmailSender: falha ao registrar EmailLog (origem=${input.meta.origem}, to=${input.to}): ${String(logError)}`,
        );
      }
    }
  }
}
