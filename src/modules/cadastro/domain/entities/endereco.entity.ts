export interface EnderecoProps {
  id: string;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;

  // Exatamente um dos três é preenchido — ver prisma/schema.md sobre o
  // FK ficar do lado do Endereco pra cascatear a exclusão a partir do dono.
  dadosReceitaId: string | null;
  cadastroComplementarId: string | null;
  representanteLegalId: string | null;
}

export class Endereco {
  private constructor(private readonly props: EnderecoProps) {}

  static create(props: EnderecoProps): Endereco {
    return new Endereco(props);
  }

  get id(): string {
    return this.props.id;
  }

  get cep(): string | null {
    return this.props.cep;
  }

  get logradouro(): string | null {
    return this.props.logradouro;
  }

  get numero(): string | null {
    return this.props.numero;
  }

  get complemento(): string | null {
    return this.props.complemento;
  }

  get bairro(): string | null {
    return this.props.bairro;
  }

  get cidade(): string | null {
    return this.props.cidade;
  }

  get uf(): string | null {
    return this.props.uf;
  }

  get dadosReceitaId(): string | null {
    return this.props.dadosReceitaId;
  }

  get cadastroComplementarId(): string | null {
    return this.props.cadastroComplementarId;
  }

  get representanteLegalId(): string | null {
    return this.props.representanteLegalId;
  }

  toJSON(): EnderecoProps {
    return { ...this.props };
  }
}
