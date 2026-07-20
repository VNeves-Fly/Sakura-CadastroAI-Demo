import type {
  WelcomeEmailInput,
  WelcomeEmailSender,
} from "@/modules/users/domain/services/welcome-email-sender";

// Integração real via Resend, direto por REST
// (https://resend.com/docs/api-reference/emails/send-email) — sem SDK,
// mesmo padrão dos outros adapters externos do projeto (D4Sign, ReceitaWS).
// Usada quando RESEND_API_KEY está configurada — ver
// console-welcome-email.adapter.ts pro fallback sem credencial.
const RESEND_API_URL = "https://api.resend.com/emails";

export class ResendWelcomeEmailAdapter implements WelcomeEmailSender {
  async send(input: WelcomeEmailInput): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM ?? "Sakura Cadastro IA <onboarding@resend.dev>";

    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: "Bem-vindo(a) ao Cadastro IA Sakura",
        html: this.buildHtml(input),
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.message ?? "Falha ao enviar e-mail de boas-vindas via Resend.");
    }
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
