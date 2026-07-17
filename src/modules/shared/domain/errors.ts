export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string) {
    super(`${resource} não encontrado(a).`);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super("Credenciais inválidas.");
    this.name = "InvalidCredentialsError";
  }
}

export class RateLimitError extends DomainError {
  constructor(message = "Muitas tentativas. Aguarde um momento antes de tentar de novo.") {
    super(message);
    this.name = "RateLimitError";
  }
}
