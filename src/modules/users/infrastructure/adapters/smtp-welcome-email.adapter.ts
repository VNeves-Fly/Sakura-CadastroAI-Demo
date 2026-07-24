import type {
  WelcomeEmailInput,
  WelcomeEmailSender,
} from "@/modules/users/domain/services/welcome-email-sender";
import {
  getSmtpFrom,
  getSmtpTransport,
} from "@/modules/shared/infrastructure/adapters/smtp-transport";

// Envio via SMTP (Gmail relay) usando nodemailer — escolhido quando
// SMTP_HOST está configurada (ver welcome-email-sender.factory.ts).
export class SmtpWelcomeEmailAdapter implements WelcomeEmailSender {
  async send(input: WelcomeEmailInput): Promise<void> {
    await getSmtpTransport().sendMail({
      from: getSmtpFrom(),
      to: input.to,
      subject: "Bem-vindo(a) ao Cadastro IA Sakura",
      html: this.buildHtml(input),
    });
  }

  private buildHtml(input: WelcomeEmailInput): string {
    const passwordBlock = input.temporaryPassword
      ? `<p>Sua senha de acesso: <strong>${input.temporaryPassword}</strong></p>
         <p>Por segurança, você vai precisar trocá-la no primeiro acesso.</p>`
      : `<p>Sua senha de acesso foi definida pelo administrador que criou seu cadastro.</p>`;

    return `
      <div style="font-family: sans-serif; font-size: 15px; color: #1f2937;">
        <p>Olá, ${input.firstName}!</p>
        <p>Sua conta no Cadastro IA Sakura foi criada com sucesso.</p>
        ${passwordBlock}
        <p>Login: <strong>${input.to}</strong></p>
      </div>
    `;
  }
}
