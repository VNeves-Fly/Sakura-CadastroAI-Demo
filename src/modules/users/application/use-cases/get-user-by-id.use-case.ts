import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";
import type { UserOutput } from "@/modules/users/application/dto/create-user.dto";

export class GetUserByIdUseCase implements UseCase<string, UserOutput> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string): Promise<UserOutput> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundError("Usuário");
    }

    return user.toJSON();
  }
}
