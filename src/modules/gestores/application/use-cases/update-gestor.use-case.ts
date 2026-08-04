import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import type { Gestor } from "@/modules/gestores/domain/entities/gestor.entity";
import type {
  GestorRepository,
  NovoUsuarioGestorData,
} from "@/modules/gestores/domain/repositories/gestor-repository";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";
import type { PasswordHasher } from "@/modules/users/domain/services/password-hasher";
import type { PasswordGenerator } from "@/modules/users/domain/services/password-generator";
import type { WelcomeEmailSender } from "@/modules/users/domain/services/welcome-email-sender";
import type { GestorOutput } from "@/modules/gestores/application/dto/create-gestor.dto";
import type { UpdateGestorInput } from "@/modules/gestores/application/dto/update-gestor.dto";
import { partirNome } from "@/modules/gestores/utils/partir-nome.util";

export interface UpdateGestorUseCaseInput {
  id: string;
  data: UpdateGestorInput;
}

export class UpdateGestorUseCase implements UseCase<UpdateGestorUseCaseInput, GestorOutput> {
  constructor(
    private readonly gestorRepository: GestorRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly passwordGenerator: PasswordGenerator,
    private readonly welcomeEmailSender: WelcomeEmailSender,
  ) {}

  async execute({ id, data: input }: UpdateGestorUseCaseInput): Promise<GestorOutput> {
    const atual = await this.gestorRepository.findById(id);
    if (!atual) {
      throw new NotFoundError("Gestor");
    }

    if (input.email && input.email !== atual.email) {
      const gestorComEsseEmail = await this.gestorRepository.findByEmail(input.email);
      if (gestorComEsseEmail && gestorComEsseEmail.id !== id) {
        throw new ConflictError("Já existe um gestor com este e-mail.");
      }
    }

    // "Criar acesso" na edição só faz sentido pra quem ainda não tem login
    // — se já tem, o form nem mostra o checkbox (ver create-gestor-form.tsx),
    // isso aqui é o reforço server-side.
    const podeConcederAcesso = input.criarAcesso && !atual.userId;

    let plainPassword: string | undefined;
    let novoUsuario: NovoUsuarioGestorData | null = null;

    if (podeConcederAcesso) {
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

    const gestor: Gestor = await this.gestorRepository.atualizar(id, {
      nome: input.nome,
      email: input.email,
      telefone: input.telefone,
      bases: input.bases,
      novoUsuario,
    });

    const revealPassword =
      podeConcederAcesso && (input.mustChangePassword || input.useTemporaryPassword);

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
