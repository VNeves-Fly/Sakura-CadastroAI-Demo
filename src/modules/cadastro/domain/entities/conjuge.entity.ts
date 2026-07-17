export interface ConjugeProps {
  id: string;
  representanteLegalId: string;
  nome: string | null;
  cpf: string | null;
  rg: string | null;
  nacionalidade: string | null;
}

export class Conjuge {
  private constructor(private readonly props: ConjugeProps) {}

  static create(props: ConjugeProps): Conjuge {
    return new Conjuge(props);
  }

  get id(): string {
    return this.props.id;
  }

  get representanteLegalId(): string {
    return this.props.representanteLegalId;
  }

  get nome(): string | null {
    return this.props.nome;
  }

  get cpf(): string | null {
    return this.props.cpf;
  }

  get rg(): string | null {
    return this.props.rg;
  }

  get nacionalidade(): string | null {
    return this.props.nacionalidade;
  }

  toJSON(): ConjugeProps {
    return { ...this.props };
  }
}
