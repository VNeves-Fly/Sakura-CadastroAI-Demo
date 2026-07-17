export interface CnaeProps {
  id: string;
  dadosReceitaId: string;
  codigo: string | null;
  descricao: string | null;
  principal: boolean;
}

export class Cnae {
  private constructor(private readonly props: CnaeProps) {}

  static create(props: CnaeProps): Cnae {
    return new Cnae(props);
  }

  get id(): string {
    return this.props.id;
  }

  get dadosReceitaId(): string {
    return this.props.dadosReceitaId;
  }

  get codigo(): string | null {
    return this.props.codigo;
  }

  get descricao(): string | null {
    return this.props.descricao;
  }

  get principal(): boolean {
    return this.props.principal;
  }

  toJSON(): CnaeProps {
    return { ...this.props };
  }
}
