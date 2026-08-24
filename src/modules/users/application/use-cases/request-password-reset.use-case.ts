import type { UseCase } from "@/modules/shared/application/use-case";
import type { EmailSender } from "@/modules/shared/domain/services/email-sender";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";
import type { PasswordResetRepository } from "@/modules/users/domain/repositories/password-reset-repository";
import type { PasswordResetCodeGenerator } from "@/modules/users/domain/services/password-reset-code-generator";
import { hashPasswordResetValue } from "@/modules/users/utils/password-reset-hash.util";
import { OTP_TTL_MINUTES } from "@/modules/users/domain/password-reset.constants";

export interface RequestPasswordResetInput {
  email: string;
  baseUrl: string;
}

function buildHtml(firstName: string, codigo: string, link: string): string {
  return `
    <div style="font-family: sans-serif; font-size: 15px; color: #1f2937;">
      <p>Olá, ${firstName}!</p>
      <p>Recebemos um pedido de recuperação de senha da sua conta no Cadastro IA Sakura.</p>
      <p>Seu código de verificação: <strong style="font-size: 20px; letter-spacing: 2px;">${codigo}</strong></p>
      <p>Ele vale por ${OTP_TTL_MINUTES} minutos. Pra continuar, acesse:</p>
      <p><a href="${link}">${link}</a></p>
      <p>Se você não pediu essa recuperação, pode ignorar este e-mail.</p>
    </div>
  `;
}

export class RequestPasswordResetUseCase implements UseCase<RequestPasswordResetInput, void> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordResetRepository: PasswordResetRepository,
    private readonly codeGenerator: PasswordResetCodeGenerator,
    private readonly emailSender: EmailSender,
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<void> {
    const user = await this.userRepository.findByEmail(input.email);

    // Não revela se o e-mail existe — evita enumeração de contas. Resposta
    // ao chamador é sempre a mesma independente do usuário existir.
    if (!user) {
      return;
    }

    await this.passwordResetRepository.deleteActiveByUserId(user.id);

    const { token, codigo } = this.codeGenerator.generate();
    const expiraEm = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.passwordResetRepository.create({
      userId: user.id,
      tokenHash: hashPasswordResetValue(token),
      codigoHash: hashPasswordResetValue(codigo),
      expiraEm,
    });

    const link = `${input.baseUrl}/redefinir-senha/${token}`;

    // E-mail é best-effort: falha no envio não pode vazar informação nem
    // derrubar o fluxo (mesma postura de CreateUserUseCase com o e-mail de
    // boas-vindas).
    try {
      await this.emailSender.send({
        to: user.email,
        subject: "Recuperação de senha — Cadastro IA Sakura",
        html: buildHtml(user.firstName, codigo, link),
        meta: { origem: "reset-senha", disparo: "manual" },
      });
    } catch (error) {
      console.error("Falha ao enviar e-mail de recuperação de senha:", error);
    }
  }
}
