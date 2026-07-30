import nodemailer from "nodemailer";

// Transporte único reaproveitado pelos adapters SMTP (genérico e de
// boas-vindas) — evita reconectar/reautenticar a cada e-mail enviado.
let transporter: nodemailer.Transporter | null = null;

// Hostname do container (Cloud Run) não é um FQDN, então sem "name"
// explícito o nodemailer manda EHLO/HELO como "[127.0.0.1]" (ver
// _getHostname em smtp-connection/index.js) — parece cliente
// malconfigurado/suspeito pro relay do Google e contribui pros erros
// 550/421 de política vistos em produção.
function getHeloName(): string {
  return process.env.SMTP_USER?.split("@")[1] ?? "localhost";
}

export function getSmtpTransport(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_PORT === "465",
    name: getHeloName(),
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
