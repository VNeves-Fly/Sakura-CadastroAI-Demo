import type { UseCase } from "@/modules/shared/application/use-case";
import { InvalidCredentialsError } from "@/modules/shared/domain/errors";
import type { CredentialsRepository } from "@/modules/auth/domain/repositories/credentials-repository";
import type { PasswordHasher } from "@/modules/auth/domain/services/password-hasher";
import { AuthenticatedUser } from "@/modules/auth/domain/entities/authenticated-user.entity";
import type {
  AuthenticateUserInput,
  AuthenticateUserOutput,
} from "@/modules/auth/application/dto/authenticate-user.dto";

export class AuthenticateUserUseCase implements UseCase<
  AuthenticateUserInput,
  AuthenticateUserOutput
> {
  constructor(
    private readonly credentialsRepository: CredentialsRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: AuthenticateUserInput): Promise<AuthenticateUserOutput> {
    const record = await this.credentialsRepository.findByEmail(input.email);

    if (!record) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await this.passwordHasher.compare(input.password, record.passwordHash);

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const authenticatedUser = AuthenticatedUser.create({
      id: record.id,
      name: record.name,
      email: record.email,
    });

    return authenticatedUser.toJSON();
  }
}
