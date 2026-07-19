import type { WelcomeEmailSender } from "@/modules/users/domain/services/welcome-email-sender";
import { ResendWelcomeEmailAdapter } from "@/modules/users/infrastructure/adapters/resend-welcome-email.adapter";
import { ConsoleWelcomeEmailAdapter } from "@/modules/users/infrastructure/adapters/console-welcome-email.adapter";

// Ponto único de escolha do provedor de e-mail transacional — trocar de
// Resend pra outro serviço (SES, Postmark, etc.) é só adicionar o adapter
// e ajustar esta condição, sem tocar em quem consome WelcomeEmailSender.
export function createWelcomeEmailSender(): WelcomeEmailSender {
  if (process.env.RESEND_API_KEY) {
    return new ResendWelcomeEmailAdapter();
  }

  return new ConsoleWelcomeEmailAdapter();
}
