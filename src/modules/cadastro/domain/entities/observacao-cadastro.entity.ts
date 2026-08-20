export interface ObservacaoCadastroProps {
  id: string;
  agenciaId: string;
  texto: string;
  registradoPor: string;
  createdAt: Date;
}

export class ObservacaoCadastro {
  private constructor(private readonly props: ObservacaoCadastroProps) {}

  static create(props: ObservacaoCadastroProps): ObservacaoCadastro {
    return new ObservacaoCadastro(props);
  }

  get id(): string {
    return this.props.id;
  }

  get agenciaId(): string {
    return this.props.agenciaId;
  }

  get texto(): string {
    return this.props.texto;
  }

  get registradoPor(): string {
    return this.props.registradoPor;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): Omit<ObservacaoCadastroProps, "createdAt"> & { createdAt: string } {
    return { ...this.props, createdAt: this.props.createdAt.toISOString() };
  }
}
