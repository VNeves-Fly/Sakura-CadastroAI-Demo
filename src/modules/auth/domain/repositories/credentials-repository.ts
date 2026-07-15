export interface CredentialsRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export interface CredentialsRepository {
  findByEmail(email: string): Promise<CredentialsRecord | null>;
}
