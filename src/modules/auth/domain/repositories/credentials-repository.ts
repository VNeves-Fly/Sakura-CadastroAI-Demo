import type { Cargo } from "@/modules/users/domain/enums";

export interface CredentialsRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  mustChangePassword: boolean;
  ativo: boolean;
  cargo: Cargo;
}

export interface CredentialsRepository {
  findByEmail(email: string): Promise<CredentialsRecord | null>;
  // Gravado a cada login bem-sucedido — alimenta "Último acesso" em
  // /usuarios (ver schema.prisma, campo lastLoginAt).
  touchLastLogin(id: string): Promise<void>;
}
