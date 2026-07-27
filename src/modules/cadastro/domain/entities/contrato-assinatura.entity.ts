export interface ContratoAssinaturaProps {
  id: string;
  contratoId: string;
  email: string;
  assinadoEm: Date;
}

export class ContratoAssinatura {
  private constructor(private readonly props: ContratoAssinaturaProps) {}

  static create(props: ContratoAssinaturaProps): ContratoAssinatura {
    return new ContratoAssinatura(props);
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

  get assinadoEm(): Date {
    return this.props.assinadoEm;
  }

  toJSON(): Omit<ContratoAssinaturaProps, "assinadoEm"> & { assinadoEm: string } {
    return { ...this.props, assinadoEm: this.props.assinadoEm.toISOString() };
  }
}
