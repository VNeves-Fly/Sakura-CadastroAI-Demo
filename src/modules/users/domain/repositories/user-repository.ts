import type { User } from "@/modules/users/domain/entities/user.entity";
import type { Cargo } from "@/modules/users/domain/enums";

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cargo: Cargo;
  mustChangePassword: boolean;
  passwordHash: string;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(data: CreateUserData): Promise<User>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
}
