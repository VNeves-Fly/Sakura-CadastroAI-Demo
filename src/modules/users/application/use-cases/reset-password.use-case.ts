import type { UseCase } from "@/modules/shared/application/use-case";
import { DomainError } from "@/modules/shared/domain/errors";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";
import type { PasswordResetRepository } from "@/modules/users/domain/repositories/password-reset-repository";
import type { PasswordHasher } from "@/modules/users/domain/services/password-hasher";
import { hashPasswordResetValue } from "@/modules/users/utils/password-reset-hash.util";

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

const INVALID_MESSAGE = "Código inválido ou expirado.";

export class ResetPasswordUseCase implements UseCase<ResetPasswordInput, void> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordResetRepository: PasswordResetRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const tokenHash = hashPasswordResetValue(input.token);
    const record = await this.passwordResetRepository.findByTokenHash(tokenHash);

    if (!record || record.status === "USED" || record.expiraEm.getTime() < Date.now()) {
      throw new DomainError(INVALID_MESSAGE);
    }

    if (record.status !== "VERIFIED") {
      throw new DomainError("Confirme o código de verificação antes de definir a nova senha.");
    }

    const passwordHash = await this.passwordHasher.hash(input.newPassword);

    // markUsed primeiro: se updatePassword falhar depois, o token fica
    // "queimado" mas a senha não muda — pior caso é o usuário pedir um
    // novo código, não um estado inconsistente de senha trocada sem token
    // consumido.
    await this.passwordResetRepository.markUsed(record.id);
    // updatePassword também limpa (numa transação) qualquer outro token
    // PENDING/VERIFIED do usuário — ver PrismaUserRepository.
    await this.userRepository.updatePassword(record.userId, passwordHash);
  }
}
