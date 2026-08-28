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
  ativo: boolean;
}

export interface UpdateUserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cargo: Cargo;
  ativo: boolean;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  // "Remover usuário" em /usuarios — desativa (ativo=false) em vez de
  // apagar a linha, ver comentário em schema.prisma no campo `ativo`.
  deactivate(id: string): Promise<User>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
}
