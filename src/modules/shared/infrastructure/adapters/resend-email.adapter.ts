import type { EmailInput, EmailSender } from "@/modules/shared/domain/services/email-sender";

// Mesmo padrão dos outros adapters externos do projeto (D4Sign, ReceitaWS,
// e o ResendWelcomeEmailAdapter de users) — REST direto, sem SDK.
const RESEND_API_URL = "https://api.resend.com/emails";

export class ResendEmailAdapter implements EmailSender {
  async send(input: EmailInput): Promise<void> {
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
        subject: input.subject,
        html: input.html,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.message ?? "Falha ao enviar e-mail via Resend.");
    }
  }
}
