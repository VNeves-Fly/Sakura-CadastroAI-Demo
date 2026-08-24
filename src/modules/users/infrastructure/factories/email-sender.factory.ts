import type { EmailSender } from "@/modules/shared/domain/services/email-sender";
import { SmtpEmailAdapter } from "@/modules/shared/infrastructure/adapters/smtp-email.adapter";
import { ConsoleEmailAdapter } from "@/modules/shared/infrastructure/adapters/console-email.adapter";
import { LoggingEmailSender } from "@/modules/shared/infrastructure/adapters/logging-email-sender.adapter";
import { PrismaEmailLogRepository } from "@/modules/shared/infrastructure/repositories/prisma-email-log.repository";
import { prisma } from "@/modules/shared/infrastructure/prisma/client";

// Ponto único de escolha do provedor de e-mail genérico (recuperação de
// senha etc.) — mesmo padrão de welcome-email-sender.factory.ts, mas pro
// EmailSender compartilhado (não o WelcomeEmailSender específico do
// e-mail de boas-vindas). Sempre envolvido em LoggingEmailSender
// (EmailLog, 2026-08-24) — é o único lugar que constrói EmailSender de
// verdade, então basta aqui pra cobrir todo caller (users, cadastro
// público/admin, atribuições).
export function createEmailSender(): EmailSender {
  const delegate = process.env.SMTP_HOST ? new SmtpEmailAdapter() : new ConsoleEmailAdapter();
  return new LoggingEmailSender(delegate, new PrismaEmailLogRepository(prisma));
}
