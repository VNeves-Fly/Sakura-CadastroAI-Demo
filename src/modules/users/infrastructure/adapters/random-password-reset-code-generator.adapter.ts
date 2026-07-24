import { randomBytes, randomInt } from "node:crypto";
import type {
  PasswordResetCode,
  PasswordResetCodeGenerator,
} from "@/modules/users/domain/services/password-reset-code-generator";

const CODIGO_DIGITS = 6;

export class RandomPasswordResetCodeGenerator implements PasswordResetCodeGenerator {
  generate(): PasswordResetCode {
    const token = randomBytes(32).toString("hex");
    const codigo = randomInt(0, 10 ** CODIGO_DIGITS)
      .toString()
      .padStart(CODIGO_DIGITS, "0");

    return { token, codigo };
  }
}
