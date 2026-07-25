import type { WelcomeEmailSender } from "@/modules/users/domain/services/welcome-email-sender";
import { SmtpWelcomeEmailAdapter } from "@/modules/users/infrastructure/adapters/smtp-welcome-email.adapter";
import { ConsoleWelcomeEmailAdapter } from "@/modules/users/infrastructure/adapters/console-welcome-email.adapter";

// Ponto único de escolha do provedor de e-mail transacional — trocar de
// provedor é só adicionar o adapter e ajustar esta condição, sem tocar em
// quem consome WelcomeEmailSender.
export function createWelcomeEmailSender(): WelcomeEmailSender {
  if (process.env.SMTP_HOST) {
    return new SmtpWelcomeEmailAdapter();
  }

  return new ConsoleWelcomeEmailAdapter();
}
