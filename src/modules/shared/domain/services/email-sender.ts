export interface EmailInput {
  to: string;
  subject: string;
  html: string;
}

// Capacidade de e-mail genérica, reaproveitável por qualquer módulo —
// diferente de WelcomeEmailSender (em users), que é específico do
// e-mail de boas-vindas com senha temporária.
export interface EmailSender {
  send(input: EmailInput): Promise<void>;
}
