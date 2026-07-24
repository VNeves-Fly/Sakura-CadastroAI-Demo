import type { EmailSender } from "@/modules/shared/domain/services/email-sender";
import { ResendEmailAdapter } from "@/modules/shared/infrastructure/adapters/resend-email.adapter";
import { ConsoleEmailAdapter } from "@/modules/shared/infrastructure/adapters/console-email.adapter";

// Ponto único de escolha do provedor de e-mail genérico (recuperação de
// senha etc.) — mesmo padrão de welcome-email-sender.factory.ts, mas pro
// EmailSender compartilhado (não o WelcomeEmailSender específico do
// e-mail de boas-vindas).
export function createEmailSender(): EmailSender {
  if (process.env.RESEND_API_KEY) {
    return new ResendEmailAdapter();
  }

  return new ConsoleEmailAdapter();
}
