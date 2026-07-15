import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError } from "@/modules/shared/domain/errors";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";
import type { PasswordHasher } from "@/modules/users/domain/services/password-hasher";
import type { CreateUserInput, UserOutput } from "@/modules/users/application/dto/create-user.dto";

export class CreateUserUseCase implements UseCase<CreateUserInput, UserOutput> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<UserOutput> {
    const existingUser = await this.userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictError("Já existe um usuário com este e-mail.");
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = await this.userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    return user.toJSON();
  }
}
