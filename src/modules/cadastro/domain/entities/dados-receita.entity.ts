export interface DadosReceitaEndereco {
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
}

export interface DadosReceitaCnae {
  codigo: string | null;
  descricao: string | null;
  principal: boolean;
}

export interface DadosReceitaProps {
  id: string;
  agenciaId: string;

  situacaoCadastral: string | null;
  dataAbertura: Date | null;
  naturezaJuridica: string | null;
  porte: string | null;
  capitalSocial: number | null;
  telefone: string | null;
  email: string | null;
  optanteSimples: boolean;
  dataOpcaoSimples: Date | null;
  endereco: DadosReceitaEndereco | null;
  cnaes: DadosReceitaCnae[];

  consultadoEm: Date;
}

export class DadosReceita {
  private constructor(private readonly props: DadosReceitaProps) {}

  static create(props: DadosReceitaProps): DadosReceita {
    return new DadosReceita(props);
  }

  get id(): string {
    return this.props.id;
  }

  get agenciaId(): string {
    return this.props.agenciaId;
  }

  get situacaoCadastral(): string | null {
    return this.props.situacaoCadastral;
  }

  get dataAbertura(): Date | null {
    return this.props.dataAbertura;
  }

  get naturezaJuridica(): string | null {
    return this.props.naturezaJuridica;
  }

  get porte(): string | null {
    return this.props.porte;
  }

  get capitalSocial(): number | null {
    return this.props.capitalSocial;
  }

  get telefone(): string | null {
    return this.props.telefone;
  }

  get email(): string | null {
    return this.props.email;
  }

  get optanteSimples(): boolean {
    return this.props.optanteSimples;
  }

  get dataOpcaoSimples(): Date | null {
    return this.props.dataOpcaoSimples;
  }

  get endereco(): DadosReceitaEndereco | null {
    return this.props.endereco;
  }

  get cnaes(): DadosReceitaCnae[] {
    return this.props.cnaes;
  }

  get consultadoEm(): Date {
    return this.props.consultadoEm;
  }

  toJSON(): Omit<DadosReceitaProps, "dataAbertura" | "dataOpcaoSimples" | "consultadoEm"> & {
    dataAbertura: string | null;
    dataOpcaoSimples: string | null;
    consultadoEm: string;
  } {
    return {
      ...this.props,
      dataAbertura: this.props.dataAbertura?.toISOString() ?? null,
      dataOpcaoSimples: this.props.dataOpcaoSimples?.toISOString() ?? null,
      consultadoEm: this.props.consultadoEm.toISOString(),
    };
  }
}
