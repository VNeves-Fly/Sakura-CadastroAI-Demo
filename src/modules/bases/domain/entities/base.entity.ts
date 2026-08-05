export interface BaseProps {
  id: string;
  sigla: string;
  nomeCidade: string;
  uf: string;
  createdAt: Date;
}

export class Base {
  private constructor(private readonly props: BaseProps) {}

  static create(props: BaseProps): Base {
    return new Base(props);
  }

  get id(): string {
    return this.props.id;
  }

  get sigla(): string {
    return this.props.sigla;
  }

  get nomeCidade(): string {
    return this.props.nomeCidade;
  }

  get uf(): string {
    return this.props.uf;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): Omit<BaseProps, "createdAt"> & { createdAt: string } {
    return {
      id: this.props.id,
      sigla: this.props.sigla,
      nomeCidade: this.props.nomeCidade,
      uf: this.props.uf,
      createdAt: this.props.createdAt.toISOString(),
    };
  }
}
