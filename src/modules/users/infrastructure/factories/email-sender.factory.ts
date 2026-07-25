import type { EmailSender } from "@/modules/shared/domain/services/email-sender";
import { SmtpEmailAdapter } from "@/modules/shared/infrastructure/adapters/smtp-email.adapter";
import { ConsoleEmailAdapter } from "@/modules/shared/infrastructure/adapters/console-email.adapter";

// Ponto único de escolha do provedor de e-mail genérico (recuperação de
// senha etc.) — mesmo padrão de welcome-email-sender.factory.ts, mas pro
// EmailSender compartilhado (não o WelcomeEmailSender específico do
// e-mail de boas-vindas).
export function createEmailSender(): EmailSender {
  if (process.env.SMTP_HOST) {
    return new SmtpEmailAdapter();
  }

  return new ConsoleEmailAdapter();
}
