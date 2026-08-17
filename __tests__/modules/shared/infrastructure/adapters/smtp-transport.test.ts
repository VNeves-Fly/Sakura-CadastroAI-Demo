jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({ sendMail: jest.fn() }),
}));

const originalEnv = process.env;

// resetModules() é essencial aqui: getSmtpTransport() guarda o transport
// num singleton de módulo (`let transporter`), então sem isolar o
// require entre os testes o segundo teste reaproveitaria o transport
// (e o env) criado pelo primeiro.
describe("getSmtpTransport", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("cria o transport com host, porta e credenciais do ambiente", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user@example.com";
    process.env.SMTP_PASSWORD = "senha-de-app";

    const nodemailer = require("nodemailer");
    const { getSmtpTransport } = require("@/modules/shared/infrastructure/adapters/smtp-transport");
    getSmtpTransport();

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      name: "example.com",
      auth: { user: "user@example.com", pass: "senha-de-app" },
    });
  });

  it("usa secure=true quando SMTP_PORT é 465", () => {
    process.env.SMTP_PORT = "465";

    const nodemailer = require("nodemailer");
    const { getSmtpTransport } = require("@/modules/shared/infrastructure/adapters/smtp-transport");
    getSmtpTransport();

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 465, secure: true }),
    );
  });

  it("usa a porta 587 (não segura) como padrão quando SMTP_PORT não está definida", () => {
    delete process.env.SMTP_PORT;

    const nodemailer = require("nodemailer");
    const { getSmtpTransport } = require("@/modules/shared/infrastructure/adapters/smtp-transport");
    getSmtpTransport();

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587, secure: false }),
    );
  });

  it("reaproveita a mesma instância de transport entre chamadas (singleton)", () => {
    const nodemailer = require("nodemailer");
    const { getSmtpTransport } = require("@/modules/shared/infrastructure/adapters/smtp-transport");

    const transport1 = getSmtpTransport();
    const transport2 = getSmtpTransport();

    expect(transport1).toBe(transport2);
    expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
  });
});

describe("getSmtpFrom", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("usa EMAIL_FROM quando configurado", () => {
    process.env.EMAIL_FROM = "Sakura Cadastro IA <nao-responder@sakura.com.br>";
    process.env.SMTP_USER = "user@sakura.com.br";

    const { getSmtpFrom } = require("@/modules/shared/infrastructure/adapters/smtp-transport");
    expect(getSmtpFrom()).toBe("Sakura Cadastro IA <nao-responder@sakura.com.br>");
  });

  it("cai pra SMTP_USER quando EMAIL_FROM não está definido", () => {
    delete process.env.EMAIL_FROM;
    process.env.SMTP_USER = "user@sakura.com.br";

    const { getSmtpFrom } = require("@/modules/shared/infrastructure/adapters/smtp-transport");
    expect(getSmtpFrom()).toBe("user@sakura.com.br");
  });
});
