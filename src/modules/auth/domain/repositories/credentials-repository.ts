import type { Cargo } from "@/modules/users/domain/enums";

export interface CredentialsRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  mustChangePassword: boolean;
  cargo: Cargo;
}

export interface CredentialsRepository {
  findByEmail(email: string): Promise<CredentialsRecord | null>;
}
