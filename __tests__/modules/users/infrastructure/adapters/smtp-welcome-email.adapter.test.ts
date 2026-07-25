jest.mock("@/modules/shared/infrastructure/adapters/smtp-transport", () => ({
  getSmtpTransport: jest.fn(),
  getSmtpFrom: jest.fn(),
}));

import { SmtpWelcomeEmailAdapter } from "@/modules/users/infrastructure/adapters/smtp-welcome-email.adapter";
import {
  getSmtpFrom,
  getSmtpTransport,
} from "@/modules/shared/infrastructure/adapters/smtp-transport";

describe("SmtpWelcomeEmailAdapter", () => {
  let sendMail: jest.Mock;

  beforeEach(() => {
    sendMail = jest.fn().mockResolvedValue(undefined);
    (getSmtpTransport as jest.Mock).mockReturnValue({ sendMail });
    (getSmtpFrom as jest.Mock).mockReturnValue("Sakura Cadastro IA <nao-responder@sakura.com.br>");
  });

  it("envia com assunto fixo, remetente do smtp-transport e destino do input", async () => {
    const adapter = new SmtpWelcomeEmailAdapter();

    await adapter.send({ to: "novo@empresa.com", firstName: "Fulano" });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Sakura Cadastro IA <nao-responder@sakura.com.br>",
        to: "novo@empresa.com",
        subject: "Bem-vindo(a) ao Cadastro IA Sakura",
      }),
    );
  });

  it("inclui a senha temporária e o aviso de troca no corpo quando informada", async () => {
    const adapter = new SmtpWelcomeEmailAdapter();

    await adapter.send({
      to: "novo@empresa.com",
      firstName: "Fulano",
      temporaryPassword: "abc123",
    });

    const html = sendMail.mock.calls[0][0].html as string;
    expect(html).toContain("abc123");
    expect(html).toContain("trocá-la no primeiro acesso");
  });

  it("indica que a senha foi definida pelo administrador quando não há senha temporária", async () => {
    const adapter = new SmtpWelcomeEmailAdapter();

    await adapter.send({ to: "novo@empresa.com", firstName: "Fulano" });

    const html = sendMail.mock.calls[0][0].html as string;
    expect(html).toContain("senha de acesso foi definida pelo administrador");
    expect(html).not.toContain("trocá-la no primeiro acesso");
  });

  it("usa o primeiro nome e o e-mail de login (to) no corpo", async () => {
    const adapter = new SmtpWelcomeEmailAdapter();

    await adapter.send({ to: "novo@empresa.com", firstName: "Fulano" });

    const html = sendMail.mock.calls[0][0].html as string;
    expect(html).toContain("Olá, Fulano!");
    expect(html).toContain("novo@empresa.com");
  });

  it("propaga o erro quando o envio falha", async () => {
    sendMail.mockRejectedValueOnce(new Error("conexão SMTP recusada"));
    const adapter = new SmtpWelcomeEmailAdapter();

    await expect(adapter.send({ to: "novo@empresa.com", firstName: "Fulano" })).rejects.toThrow(
      "conexão SMTP recusada",
    );
  });
});
