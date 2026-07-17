export interface GateValidacaoProps {
  id: string;
  agenciaId: string;
  etapaAlvo: number | null;
  liberado: boolean | null;
  motivoBloqueio: string | null;
  avaliadoEm: Date;
}

export class GateValidacao {
  private constructor(private readonly props: GateValidacaoProps) {}

  static create(props: GateValidacaoProps): GateValidacao {
    return new GateValidacao(props);
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

  get liberado(): boolean | null {
    return this.props.liberado;
  }

  get motivoBloqueio(): string | null {
    return this.props.motivoBloqueio;
  }

  get avaliadoEm(): Date {
    return this.props.avaliadoEm;
  }

  toJSON(): Omit<GateValidacaoProps, "avaliadoEm"> & { avaliadoEm: string } {
    return {
      ...this.props,
      avaliadoEm: this.props.avaliadoEm.toISOString(),
    };
  }
}
