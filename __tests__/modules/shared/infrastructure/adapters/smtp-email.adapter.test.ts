jest.mock("@/modules/shared/infrastructure/adapters/smtp-transport", () => ({
  getSmtpTransport: jest.fn(),
  getSmtpFrom: jest.fn(),
}));

import { SmtpEmailAdapter } from "@/modules/shared/infrastructure/adapters/smtp-email.adapter";
import {
  getSmtpFrom,
  getSmtpTransport,
} from "@/modules/shared/infrastructure/adapters/smtp-transport";

describe("SmtpEmailAdapter", () => {
  let sendMail: jest.Mock;

  beforeEach(() => {
    sendMail = jest.fn().mockResolvedValue(undefined);
    (getSmtpTransport as jest.Mock).mockReturnValue({ sendMail });
    (getSmtpFrom as jest.Mock).mockReturnValue("Sakura Cadastro IA <nao-responder@sakura.com.br>");
  });

  it("envia o e-mail com from do smtp-transport e to/subject/html do input", async () => {
    const adapter = new SmtpEmailAdapter();

    await adapter.send({
      to: "destinatario@empresa.com",
      subject: "Reenvio de documentos",
      html: "<p>Segue o link para reenvio.</p>",
      meta: { origem: "teste", disparo: "manual" },
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: "Sakura Cadastro IA <nao-responder@sakura.com.br>",
      to: "destinatario@empresa.com",
      subject: "Reenvio de documentos",
      html: "<p>Segue o link para reenvio.</p>",
    });
  });

  it("propaga o erro quando o envio falha", async () => {
    sendMail.mockRejectedValueOnce(new Error("conexão SMTP recusada"));
    const adapter = new SmtpEmailAdapter();

    await expect(
      adapter.send({
        to: "destinatario@empresa.com",
        subject: "Assunto",
        html: "<p>Oi</p>",
        meta: { origem: "teste", disparo: "manual" },
      }),
    ).rejects.toThrow("conexão SMTP recusada");
  });
});
