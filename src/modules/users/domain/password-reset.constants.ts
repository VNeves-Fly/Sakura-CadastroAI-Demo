// Validade do OTP de recuperação de senha, a partir da criação do token.
export const OTP_TTL_MINUTES = 30;

// Tentativas de código erradas permitidas por token antes de bloquear e
// exigir que o usuário peça um novo (ver VerifyPasswordResetCodeUseCase).
export const MAX_OTP_ATTEMPTS = 5;
