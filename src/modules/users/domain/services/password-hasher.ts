export interface PasswordHasher {
  hash(plainText: string): Promise<string>;
}
