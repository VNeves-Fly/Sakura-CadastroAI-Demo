import type { EmailInput, EmailSender } from "@/modules/shared/domain/services/email-sender";
import {
  getSmtpFrom,
  getSmtpTransport,
} from "@/modules/shared/infrastructure/adapters/smtp-transport";

// Envio via SMTP (Gmail relay) usando nodemailer — escolhido no
// composition root quando SMTP_HOST está configurada (ver
// cadastro-admin.controller.ts).
export class SmtpEmailAdapter implements EmailSender {
  async send(input: EmailInput): Promise<void> {
    await getSmtpTransport().sendMail({
      from: getSmtpFrom(),
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
  }
}
