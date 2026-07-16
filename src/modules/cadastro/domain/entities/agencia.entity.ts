export interface AgenciaProps {
  id: string;
  razaoSocial: string;
  cnpj: string;
  etapaAtual: number;
  status: string;
  contratoSocialPath: string;
  emailContato: string;
  telefoneContato: string;
  origem: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Agencia {
  private constructor(private readonly props: AgenciaProps) {}

  static create(props: AgenciaProps): Agencia {
    return new Agencia(props);
  }

  get id(): string {
    return this.props.id;
  }

  get razaoSocial(): string {
    return this.props.razaoSocial;
  }

  get cnpj(): string {
    return this.props.cnpj;
  }

  get etapaAtual(): number {
    return this.props.etapaAtual;
  }

  get status(): string {
    return this.props.status;
  }

  toJSON(): Omit<AgenciaProps, "createdAt" | "updatedAt"> & {
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: this.props.id,
      razaoSocial: this.props.razaoSocial,
      cnpj: this.props.cnpj,
      etapaAtual: this.props.etapaAtual,
      status: this.props.status,
      contratoSocialPath: this.props.contratoSocialPath,
      emailContato: this.props.emailContato,
      telefoneContato: this.props.telefoneContato,
      origem: this.props.origem,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
