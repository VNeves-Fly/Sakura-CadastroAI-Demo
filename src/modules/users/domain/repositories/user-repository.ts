import type { User } from "@/modules/users/domain/entities/user.entity";

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(data: CreateUserData): Promise<User>;
}
