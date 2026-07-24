import { createHash } from "node:crypto";

// Token e OTP de recuperação de senha nunca são persistidos em texto puro —
// só este hash. Não precisa de bcrypt/custo alto: a proteção real vem de
// expiraEm + tentativas + status USED (uso único), não do custo do hash.
export function hashPasswordResetValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
