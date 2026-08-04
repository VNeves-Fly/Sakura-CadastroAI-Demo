import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type {
  NovoUsuarioPromotorData,
  PromotorRepository,
} from "@/modules/atribuicoes/domain/repositories/promotor-repository";
import type { GestorRepository } from "@/modules/gestores/domain/repositories/gestor-repository";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";
import type { PasswordHasher } from "@/modules/users/domain/services/password-hasher";
import type { PasswordGenerator } from "@/modules/users/domain/services/password-generator";
import type { WelcomeEmailSender } from "@/modules/users/domain/services/welcome-email-sender";
import type { PromotorOutput } from "@/modules/atribuicoes/application/dto/create-promotor.dto";
import type { UpdatePromotorInput } from "@/modules/atribuicoes/application/dto/update-promotor.dto";
import { partirNome } from "@/modules/gestores/utils/partir-nome.util";

export interface AtualizarPromotorUseCaseInput {
  id: string;
  data: UpdatePromotorInput;
}

export class AtualizarPromotorUseCase implements UseCase<
  AtualizarPromotorUseCaseInput,
  PromotorOutput
> {
  constructor(
    private readonly promotorRepository: PromotorRepository,
    private readonly gestorRepository: GestorRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly passwordGenerator: PasswordGenerator,
    private readonly welcomeEmailSender: WelcomeEmailSender,
  ) {}

  async execute({ id, data: input }: AtualizarPromotorUseCaseInput): Promise<PromotorOutput> {
    const atual = await this.promotorRepository.findById(id);
    if (!atual) {
      throw new NotFoundError("Executivo");
    }

    const gestor = await this.gestorRepository.findById(input.gestorId);
    if (!gestor) {
      throw new DomainError("Gestor selecionado não existe.");
    }

    if (input.email !== atual.email) {
      const promotorComEsseEmail = await this.promotorRepository.findByEmail(input.email);
      if (promotorComEsseEmail && promotorComEsseEmail.id !== id) {
        throw new ConflictError("Já existe um executivo com este e-mail.");
      }
    }

    // "Criar acesso" na edição só faz sentido pra quem ainda não tem login.
    const podeConcederAcesso = input.criarAcesso && !atual.userId;

    let plainPassword: string | undefined;
    let novoUsuario: NovoUsuarioPromotorData | null = null;

    if (podeConcederAcesso) {
      const usuarioExistente = await this.userRepository.findByEmail(input.email);
      if (usuarioExistente) {
        throw new ConflictError("Já existe um usuário com este e-mail.");
      }

      plainPassword = input.useTemporaryPassword
        ? this.passwordGenerator.generate()
        : input.password!;
      const passwordHash = await this.passwordHasher.hash(plainPassword);
      const { firstName, lastName } = partirNome(input.nome);

      novoUsuario = {
        email: input.email,
        firstName,
        lastName,
        passwordHash,
        mustChangePassword: input.mustChangePassword,
      };
    }

    const promotor = await this.promotorRepository.atualizar(id, {
      nome: input.nome,
      sica: input.sica,
      email: input.email,
      telefone: input.telefone,
      gestorId: input.gestorId,
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
      ...promotor.toJSON(),
      temporaryPassword: revealPassword ? plainPassword : undefined,
    };
  }
}
