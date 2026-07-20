import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";
import type { PasswordHasher } from "@/modules/users/domain/services/password-hasher";

export interface ChangePasswordInput {
  userId: string;
  newPassword: string;
}

export class ChangePasswordUseCase implements UseCase<ChangePasswordInput, void> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new NotFoundError("Usuário");
    }

    const passwordHash = await this.passwordHasher.hash(input.newPassword);
    await this.userRepository.updatePassword(user.id, passwordHash);
  }
}
