import type { PapelSignatarioPadrao } from "@/modules/cadastro/domain/enums";

export interface SignatarioPadraoProps {
  id: string;
  nome: string | null;
  cargo: string | null;
  email: string | null;
  telefone: string | null;
  // null = ativo; preenchido = removido (soft delete, reversível).
  deletedAt: Date | null;
  ordem: number | null;
  papel: PapelSignatarioPadrao;
  estagio: number;
}

export class SignatarioPadrao {
  private constructor(private readonly props: SignatarioPadraoProps) {}

  static create(props: SignatarioPadraoProps): SignatarioPadrao {
    return new SignatarioPadrao(props);
  }

  get id(): string {
    return this.props.id;
  }

  get nome(): string | null {
    return this.props.nome;
  }

  get cargo(): string | null {
    return this.props.cargo;
  }

  get email(): string | null {
    return this.props.email;
  }

  get telefone(): string | null {
    return this.props.telefone;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  get ativo(): boolean {
    return this.props.deletedAt === null;
  }

  get ordem(): number | null {
    return this.props.ordem;
  }

  get papel(): PapelSignatarioPadrao {
    return this.props.papel;
  }

  get estagio(): number {
    return this.props.estagio;
  }

  toJSON(): SignatarioPadraoProps {
    return { ...this.props };
  }
}
