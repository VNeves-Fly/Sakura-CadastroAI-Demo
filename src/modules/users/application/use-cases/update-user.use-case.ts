import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";
import type { UpdateUserInput } from "@/modules/users/application/dto/update-user.dto";
import type { UserOutput } from "@/modules/users/application/dto/create-user.dto";

export interface UpdateUserExecuteInput {
  id: string;
  data: UpdateUserInput;
}

export class UpdateUserUseCase implements UseCase<UpdateUserExecuteInput, UserOutput> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({ id, data }: UpdateUserExecuteInput): Promise<UserOutput> {
    const current = await this.userRepository.findById(id);

    if (!current) {
      throw new NotFoundError("Usuário");
    }

    if (data.email !== current.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictError("Já existe um usuário com este e-mail.");
      }
    }

    const updated = await this.userRepository.update(id, data);
    return updated.toJSON();
  }
}
