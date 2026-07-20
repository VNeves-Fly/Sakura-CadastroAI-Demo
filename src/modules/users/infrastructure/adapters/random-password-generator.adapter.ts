import { randomInt } from "node:crypto";
import type { PasswordGenerator } from "@/modules/users/domain/services/password-generator";

// Exclui caracteres ambíguos (0/O, 1/l/I) pra senha temporária ser fácil de
// digitar por quem recebe. Garante ao menos um char de cada classe pra
// passar em validações de força comuns.
const UPPERCASE = "ABCDEFGHJKMNPQRSTUVWXYZ";
const LOWERCASE = "abcdefghjkmnpqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*";
const ALL_CHARS = UPPERCASE + LOWERCASE + DIGITS + SYMBOLS;
const PASSWORD_LENGTH = 12;

function pickRandomChar(pool: string): string {
  // randomInt(pool.length) sempre cai dentro de [0, pool.length), então o
  // índice nunca é undefined — asserção só pra contornar noUncheckedIndexedAccess.
  return pool[randomInt(pool.length)]!;
}

function shuffle(chars: string[]): string[] {
  const result = [...chars];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export class RandomPasswordGenerator implements PasswordGenerator {
  generate(): string {
    const required = [
      pickRandomChar(UPPERCASE),
      pickRandomChar(LOWERCASE),
      pickRandomChar(DIGITS),
      pickRandomChar(SYMBOLS),
    ];

    const remainingLength = PASSWORD_LENGTH - required.length;
    const remaining = Array.from({ length: remainingLength }, () => pickRandomChar(ALL_CHARS));

    return shuffle([...required, ...remaining]).join("");
  }
}
