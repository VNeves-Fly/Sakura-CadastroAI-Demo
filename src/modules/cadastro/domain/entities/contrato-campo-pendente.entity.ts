export interface ContratoCampoPendenteProps {
  id: string;
  contratoSignatarioId: string;
  campo: string | null;
}

export class ContratoCampoPendente {
  private constructor(private readonly props: ContratoCampoPendenteProps) {}

  static create(props: ContratoCampoPendenteProps): ContratoCampoPendente {
    return new ContratoCampoPendente(props);
  }

  get id(): string {
    return this.props.id;
  }

  get contratoSignatarioId(): string {
    return this.props.contratoSignatarioId;
  }

  get campo(): string | null {
    return this.props.campo;
  }

  toJSON(): ContratoCampoPendenteProps {
    return { ...this.props };
  }
}
