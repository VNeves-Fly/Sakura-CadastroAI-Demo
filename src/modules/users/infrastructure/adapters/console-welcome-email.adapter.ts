import type {
  WelcomeEmailInput,
  WelcomeEmailSender,
} from "@/modules/users/domain/services/welcome-email-sender";

// Fallback usado quando SMTP_HOST não está configurada — apenas loga
// no console em vez de enviar de verdade (mesmo padrão dos outros mocks do
// projeto, ex. mock-d4sign.adapter.ts).
export class ConsoleWelcomeEmailAdapter implements WelcomeEmailSender {
  async send(input: WelcomeEmailInput): Promise<void> {
    console.warn(
      `[email:boas-vindas:mock] Para: ${input.to} | Olá, ${input.firstName}!` +
        (input.temporaryPassword ? ` | Senha: ${input.temporaryPassword}` : ""),
    );
  }
}
