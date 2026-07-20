import type { EmailInput, EmailSender } from "@/modules/shared/domain/services/email-sender";

// Fallback sem credencial (RESEND_API_KEY ausente) — só loga, não bloqueia
// o fluxo em dev/local.
export class ConsoleEmailAdapter implements EmailSender {
  async send(input: EmailInput): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`[e-mail simulado] para=${input.to} assunto="${input.subject}"\n${input.html}`);
  }
}
