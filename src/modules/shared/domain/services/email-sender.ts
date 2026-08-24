import type { DisparoEmail } from "@/modules/shared/domain/enums";

export interface EmailMeta {
  // Identificador curto de qual notificação está mandando o e-mail (ex.:
  // "cadastro-aprovado", "biometria-verificacao") — vira EmailLog.origem.
  origem: string;
  disparo: DisparoEmail;
  agenciaId?: string;
}

export interface EmailInput {
  to: string;
  subject: string;
  html: string;
  // Obrigatório desde o EmailLog (2026-08-24) — todo .send() precisa
  // declarar quem está mandando e se foi manual ou automático, pra
  // LoggingEmailSender registrar (ver createEmailSender).
  meta: EmailMeta;
}

// Capacidade de e-mail genérica, reaproveitável por qualquer módulo —
// diferente de WelcomeEmailSender (em users), que é específico do
// e-mail de boas-vindas com senha temporária.
export interface EmailSender {
  send(input: EmailInput): Promise<void>;
}
