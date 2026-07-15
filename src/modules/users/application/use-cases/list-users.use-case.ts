import type { UseCase } from "@/modules/shared/application/use-case";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";
import type { UserOutput } from "@/modules/users/application/dto/create-user.dto";

export class ListUsersUseCase implements UseCase<void, UserOutput[]> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<UserOutput[]> {
    const users = await this.userRepository.findAll();
    return users.map((user) => user.toJSON());
  }
}
