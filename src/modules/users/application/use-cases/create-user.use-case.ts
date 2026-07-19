import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError } from "@/modules/shared/domain/errors";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";
import type { PasswordHasher } from "@/modules/users/domain/services/password-hasher";
import type { PasswordGenerator } from "@/modules/users/domain/services/password-generator";
import type { WelcomeEmailSender } from "@/modules/users/domain/services/welcome-email-sender";
import type { CreateUserInput, UserOutput } from "@/modules/users/application/dto/create-user.dto";

export class CreateUserUseCase implements UseCase<CreateUserInput, UserOutput> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly passwordGenerator: PasswordGenerator,
    private readonly welcomeEmailSender: WelcomeEmailSender,
  ) {}

  async execute(input: CreateUserInput): Promise<UserOutput> {
    const existingUser = await this.userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictError("Já existe um usuário com este e-mail.");
    }

    const plainPassword = input.useTemporaryPassword
      ? this.passwordGenerator.generate()
      : input.password!;
    const passwordHash = await this.passwordHasher.hash(plainPassword);

    const user = await this.userRepository.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      cargo: input.cargo,
      mustChangePassword: input.mustChangePassword,
      passwordHash,
    });

    // Só revela a senha em texto puro quando o admin pediu troca no
    // primeiro acesso e/ou senha temporária — do contrário, é a senha que
    // o próprio admin digitou, já conhecida por ele.
    const revealPassword = input.mustChangePassword || input.useTemporaryPassword;

    // E-mail é best-effort: falha no envio não pode derrubar a criação do
    // usuário (mesma postura do resto do projeto com serviços externos).
    try {
      await this.welcomeEmailSender.send({
        to: user.email,
        firstName: user.firstName,
        temporaryPassword: revealPassword ? plainPassword : undefined,
      });
    } catch (error) {
      console.error("Falha ao enviar e-mail de boas-vindas:", error);
    }

    return {
      ...user.toJSON(),
      temporaryPassword: revealPassword ? plainPassword : undefined,
    };
  }
}
