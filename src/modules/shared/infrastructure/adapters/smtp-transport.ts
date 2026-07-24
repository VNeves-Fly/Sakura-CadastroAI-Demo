import nodemailer from "nodemailer";

// Transporte único reaproveitado pelos adapters SMTP (genérico e de
// boas-vindas) — evita reconectar/reautenticar a cada e-mail enviado.
let transporter: nodemailer.Transporter | null = null;

export function getSmtpTransport(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
}

export function getSmtpFrom(): string {
  return process.env.EMAIL_FROM ?? (process.env.SMTP_USER as string);
}
