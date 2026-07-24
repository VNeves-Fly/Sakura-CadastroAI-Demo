export interface PasswordResetCode {
  // Vai na URL do e-mail (/redefinir-senha/[token]) — alta entropia, é a
  // credencial que localiza o registro.
  token: string;
  // OTP de 6 dígitos que o usuário digita, lido do corpo do e-mail.
  codigo: string;
}

export interface PasswordResetCodeGenerator {
  generate(): PasswordResetCode;
}
