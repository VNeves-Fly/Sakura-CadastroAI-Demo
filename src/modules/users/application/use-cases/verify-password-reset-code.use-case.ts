import type { UseCase } from "@/modules/shared/application/use-case";
import { DomainError } from "@/modules/shared/domain/errors";
import type { PasswordResetRepository } from "@/modules/users/domain/repositories/password-reset-repository";
import { hashPasswordResetValue } from "@/modules/users/utils/password-reset-hash.util";
import { MAX_OTP_ATTEMPTS } from "@/modules/users/domain/password-reset.constants";

export interface VerifyPasswordResetCodeInput {
  token: string;
  codigo: string;
}

// Mensagem deliberadamente genérica: não distingue "token não existe" de
// "expirou" de "código errado", pra não dar pista útil a quem está tentando
// adivinhar.
const INVALID_MESSAGE = "Código inválido ou expirado.";

export class VerifyPasswordResetCodeUseCase implements UseCase<VerifyPasswordResetCodeInput, void> {
  constructor(private readonly passwordResetRepository: PasswordResetRepository) {}

  async execute(input: VerifyPasswordResetCodeInput): Promise<void> {
    const tokenHash = hashPasswordResetValue(input.token);
    const record = await this.passwordResetRepository.findByTokenHash(tokenHash);

    if (!record || record.status === "USED" || record.expiraEm.getTime() < Date.now()) {
      throw new DomainError(INVALID_MESSAGE);
    }

    if (record.tentativas >= MAX_OTP_ATTEMPTS) {
      throw new DomainError("Você excedeu o número de tentativas. Solicite um novo código.");
    }

    const codigoHash = hashPasswordResetValue(input.codigo);

    if (codigoHash !== record.codigoHash) {
      // Conta a tentativa só em caso de erro — reenvios do mesmo código
      // correto (ex: reload de página) não consomem o limite.
      await this.passwordResetRepository.incrementAttempts(record.id);
      throw new DomainError(INVALID_MESSAGE);
    }

    if (record.status === "PENDING") {
      await this.passwordResetRepository.markVerified(record.id);
    }
  }
}
