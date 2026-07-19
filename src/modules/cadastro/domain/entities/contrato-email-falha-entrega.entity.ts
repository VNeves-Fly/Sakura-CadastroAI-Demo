export interface ContratoEmailFalhaEntregaProps {
  id: string;
  contratoId: string;
  email: string;
  motivo: string | null;
  criadoEm: Date;
}

export class ContratoEmailFalhaEntrega {
  private constructor(private readonly props: ContratoEmailFalhaEntregaProps) {}

  static create(props: ContratoEmailFalhaEntregaProps): ContratoEmailFalhaEntrega {
    return new ContratoEmailFalhaEntrega(props);
  }

  get id(): string {
    return this.props.id;
  }

  get contratoId(): string {
    return this.props.contratoId;
  }

  get email(): string {
    return this.props.email;
  }

  get motivo(): string | null {
    return this.props.motivo;
  }

  get criadoEm(): Date {
    return this.props.criadoEm;
  }

  toJSON(): Omit<ContratoEmailFalhaEntregaProps, "criadoEm"> & { criadoEm: string } {
    return { ...this.props, criadoEm: this.props.criadoEm.toISOString() };
  }
}
