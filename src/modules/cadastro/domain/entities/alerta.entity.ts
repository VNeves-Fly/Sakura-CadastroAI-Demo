export interface AlertaProps {
  id: string;
  agenciaId: string;
  tipo: string | null;
  mensagem: string | null;
  criadoEm: Date;
  resolvidoEm: Date | null;
}

export class Alerta {
  private constructor(private readonly props: AlertaProps) {}

  static create(props: AlertaProps): Alerta {
    return new Alerta(props);
  }

  get id(): string {
    return this.props.id;
  }

  get agenciaId(): string {
    return this.props.agenciaId;
  }

  get tipo(): string | null {
    return this.props.tipo;
  }

  get mensagem(): string | null {
    return this.props.mensagem;
  }

  get criadoEm(): Date {
    return this.props.criadoEm;
  }

  get resolvidoEm(): Date | null {
    return this.props.resolvidoEm;
  }

  toJSON(): Omit<AlertaProps, "criadoEm" | "resolvidoEm"> & {
    criadoEm: string;
    resolvidoEm: string | null;
  } {
    return {
      ...this.props,
      criadoEm: this.props.criadoEm.toISOString(),
      resolvidoEm: this.props.resolvidoEm?.toISOString() ?? null,
    };
  }
}
