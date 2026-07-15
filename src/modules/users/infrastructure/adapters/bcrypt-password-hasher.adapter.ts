import bcrypt from "bcryptjs";
import type { PasswordHasher } from "@/modules/users/domain/services/password-hasher";

const SALT_ROUNDS = 10;

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, SALT_ROUNDS);
  }
}
