import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError } from "@/modules/shared/domain/errors";
import type {
  GestorRepository,
  NovoUsuarioGestorData,
} from "@/modules/gestores/domain/repositories/gestor-repository";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";
import type { PasswordHasher } from "@/modules/users/domain/services/password-hasher";
import type { PasswordGenerator } from "@/modules/users/domain/services/password-generator";
import type { WelcomeEmailSender } from "@/modules/users/domain/services/welcome-email-sender";
import type {
  CreateGestorInput,
  GestorOutput,
} from "@/modules/gestores/application/dto/create-gestor.dto";
import { partirNome } from "@/modules/gestores/utils/partir-nome.util";

export class CreateGestorUseCase implements UseCase<CreateGestorInput, GestorOutput> {
  constructor(
    private readonly gestorRepository: GestorRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly passwordGenerator: PasswordGenerator,
    private readonly welcomeEmailSender: WelcomeEmailSender,
  ) {}

  async execute(input: CreateGestorInput): Promise<GestorOutput> {
    if (input.email) {
      const gestorExistente = await this.gestorRepository.findByEmail(input.email);
      if (gestorExistente) {
        throw new ConflictError("Já existe um gestor com este e-mail.");
      }
    }

    let plainPassword: string | undefined;
    let novoUsuario: NovoUsuarioGestorData | null = null;

    if (input.criarAcesso) {
      // Validado pelo schema (criarAcesso exige email), mas o TS não sabe.
      const email = input.email!;
      const usuarioExistente = await this.userRepository.findByEmail(email);
      if (usuarioExistente) {
        throw new ConflictError("Já existe um usuário com este e-mail.");
      }

      plainPassword = input.useTemporaryPassword
        ? this.passwordGenerator.generate()
        : input.password!;
      const passwordHash = await this.passwordHasher.hash(plainPassword);
      const { firstName, lastName } = partirNome(input.nome);

      novoUsuario = {
        email,
        firstName,
        lastName,
        passwordHash,
        mustChangePassword: input.mustChangePassword,
      };
    }

    const gestor = await this.gestorRepository.criar({
      nome: input.nome,
      email: input.email,
      telefone: input.telefone,
      baseIds: input.baseIds,
      novoUsuario,
    });

    const revealPassword =
      input.criarAcesso && (input.mustChangePassword || input.useTemporaryPassword);

    if (novoUsuario) {
      try {
        await this.welcomeEmailSender.send({
          to: novoUsuario.email,
          firstName: novoUsuario.firstName,
          temporaryPassword: revealPassword ? plainPassword : undefined,
        });
      } catch (error) {
        console.error("Falha ao enviar e-mail de boas-vindas:", error);
      }
    }

    return {
      ...gestor.toJSON(),
      temporaryPassword: revealPassword ? plainPassword : undefined,
    };
  }
}
