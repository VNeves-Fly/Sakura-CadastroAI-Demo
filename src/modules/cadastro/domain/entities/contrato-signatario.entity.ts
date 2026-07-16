export interface ContratoSignatarioProps {
  id: string;
  contratoId: string;

  // Exatamente um dos dois é preenchido.
  representanteLegalId: string | null;
  signatarioPadraoId: string | null;

  nome: string;
  email: string;
  cpf: string;
  rg: string | null;
  rgOrgaoEmissor: string | null;
  cargo: string | null;
  nacionalidade: string | null;
  estadoCivil: string | null;
  dataNascimento: Date | null;

  // Snapshot imutável do endereço no momento da geração do contrato — não
  // é uma relação com Endereco, ver comentário em Contrato no schema.
  cepSnapshot: string | null;
  logradouroSnapshot: string | null;
  numeroSnapshot: string | null;
  complementoSnapshot: string | null;
  bairroSnapshot: string | null;
  cidadeSnapshot: string | null;
  ufSnapshot: string | null;
}

export class ContratoSignatario {
  private constructor(private readonly props: ContratoSignatarioProps) {}

  static create(props: ContratoSignatarioProps): ContratoSignatario {
    return new ContratoSignatario(props);
  }

  get id(): string {
    return this.props.id;
  }

  get contratoId(): string {
    return this.props.contratoId;
  }

  get representanteLegalId(): string | null {
    return this.props.representanteLegalId;
  }

  get signatarioPadraoId(): string | null {
    return this.props.signatarioPadraoId;
  }

  get nome(): string {
    return this.props.nome;
  }

  get email(): string {
    return this.props.email;
  }

  get cpf(): string {
    return this.props.cpf;
  }

  get rg(): string | null {
    return this.props.rg;
  }

  get rgOrgaoEmissor(): string | null {
    return this.props.rgOrgaoEmissor;
  }

  get cargo(): string | null {
    return this.props.cargo;
  }

  get nacionalidade(): string | null {
    return this.props.nacionalidade;
  }

  get estadoCivil(): string | null {
    return this.props.estadoCivil;
  }

  get dataNascimento(): Date | null {
    return this.props.dataNascimento;
  }

  get cepSnapshot(): string | null {
    return this.props.cepSnapshot;
  }

  get logradouroSnapshot(): string | null {
    return this.props.logradouroSnapshot;
  }

  get numeroSnapshot(): string | null {
    return this.props.numeroSnapshot;
  }

  get complementoSnapshot(): string | null {
    return this.props.complementoSnapshot;
  }

  get bairroSnapshot(): string | null {
    return this.props.bairroSnapshot;
  }

  get cidadeSnapshot(): string | null {
    return this.props.cidadeSnapshot;
  }

  get ufSnapshot(): string | null {
    return this.props.ufSnapshot;
  }

  toJSON(): Omit<ContratoSignatarioProps, "dataNascimento"> & {
    dataNascimento: string | null;
  } {
    return {
      ...this.props,
      dataNascimento: this.props.dataNascimento?.toISOString() ?? null,
    };
  }
}
