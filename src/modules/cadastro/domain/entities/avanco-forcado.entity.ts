export interface AvancoForcadoProps {
  id: string;
  agenciaId: string;
  etapaAlvo: number | null;
  motivo: string | null;
  gateMotivoBloqueio: string | null;
  statusReal: string | null;
  solicitadoPor: string | null;
  autorizadoPor: string | null;
  createdAt: Date;
}

export class AvancoForcado {
  private constructor(private readonly props: AvancoForcadoProps) {}

  static create(props: AvancoForcadoProps): AvancoForcado {
    return new AvancoForcado(props);
  }

  get id(): string {
    return this.props.id;
  }

  get agenciaId(): string {
    return this.props.agenciaId;
  }

  get etapaAlvo(): number | null {
    return this.props.etapaAlvo;
  }

  get motivo(): string | null {
    return this.props.motivo;
  }

  get gateMotivoBloqueio(): string | null {
    return this.props.gateMotivoBloqueio;
  }

  get statusReal(): string | null {
    return this.props.statusReal;
  }

  get solicitadoPor(): string | null {
    return this.props.solicitadoPor;
  }

  get autorizadoPor(): string | null {
    return this.props.autorizadoPor;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): Omit<AvancoForcadoProps, "createdAt"> & { createdAt: string } {
    return {
      ...this.props,
      createdAt: this.props.createdAt.toISOString(),
    };
  }
}
