export interface CidadeComercialProps {
  id: string;
  regiao: string | null;
  estado: string | null;
  cidade: string;
  ddd: string | null;
  base: string | null;
  executivo: string | null;
  gestor: string | null;
  subregiaoSp: string | null;
}

export class CidadeComercial {
  private constructor(private readonly props: CidadeComercialProps) {}

  static create(props: CidadeComercialProps): CidadeComercial {
    return new CidadeComercial(props);
  }

  get id(): string {
    return this.props.id;
  }

  get regiao(): string | null {
    return this.props.regiao;
  }

  get estado(): string | null {
    return this.props.estado;
  }

  get cidade(): string {
    return this.props.cidade;
  }

  get ddd(): string | null {
    return this.props.ddd;
  }

  get base(): string | null {
    return this.props.base;
  }

  get executivo(): string | null {
    return this.props.executivo;
  }

  get gestor(): string | null {
    return this.props.gestor;
  }

  get subregiaoSp(): string | null {
    return this.props.subregiaoSp;
  }

  toJSON(): CidadeComercialProps {
    return { ...this.props };
  }
}
