export interface AvancoForcadoPendenciaProps {
  id: string;
  avancoForcadoId: string;
  descricao: string | null;
}

export class AvancoForcadoPendencia {
  private constructor(private readonly props: AvancoForcadoPendenciaProps) {}

  static create(props: AvancoForcadoPendenciaProps): AvancoForcadoPendencia {
    return new AvancoForcadoPendencia(props);
  }

  get id(): string {
    return this.props.id;
  }

  get avancoForcadoId(): string {
    return this.props.avancoForcadoId;
  }

  get descricao(): string | null {
    return this.props.descricao;
  }

  toJSON(): AvancoForcadoPendenciaProps {
    return { ...this.props };
  }
}
