export interface CadastroComplementarProps {
  id: string;
  agenciaId: string;

  telefoneComercial: string | null;
  emailOperacional: string | null;
  emailComercial: string | null;
  emailFinanceiro: string | null;

  cadasturNumero: string | null;
  cadasturDataCadastro: Date | null;
  cadasturValidade: Date | null;
  cadasturSituacao: string | null;

  resideBrasil: boolean | null;

  tipoAgencia: string | null;
  enderecoAgenciaMesmoTitular: boolean | null;
  socioVinculadoEnderecoId: string | null;

  bancoPais: string | null;
  bancoNome: string | null;
  bancoAgencia: string | null;
  bancoConta: string | null;
  bancoSwift: string | null;
  tipoConta: string | null;
  favorecidoEhEmpresa: boolean | null;
  favorecidoNome: string | null;
  favorecidoDoc: string | null;

  chavePix: string | null;
  tipoChavePix: string | null;
  tipoFaturamento: string | null;
  percCorporativo: number | null;
  percConvencional: number | null;

  submetidoAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class CadastroComplementar {
  private constructor(private readonly props: CadastroComplementarProps) {}

  static create(props: CadastroComplementarProps): CadastroComplementar {
    return new CadastroComplementar(props);
  }

  get id(): string {
    return this.props.id;
  }

  get agenciaId(): string {
    return this.props.agenciaId;
  }

  get telefoneComercial(): string | null {
    return this.props.telefoneComercial;
  }

  get emailOperacional(): string | null {
    return this.props.emailOperacional;
  }

  get emailComercial(): string | null {
    return this.props.emailComercial;
  }

  get emailFinanceiro(): string | null {
    return this.props.emailFinanceiro;
  }

  get cadasturNumero(): string | null {
    return this.props.cadasturNumero;
  }

  get cadasturDataCadastro(): Date | null {
    return this.props.cadasturDataCadastro;
  }

  get cadasturValidade(): Date | null {
    return this.props.cadasturValidade;
  }

  get cadasturSituacao(): string | null {
    return this.props.cadasturSituacao;
  }

  get resideBrasil(): boolean | null {
    return this.props.resideBrasil;
  }

  get clienteInternacional(): boolean | null {
    return this.props.resideBrasil === null ? null : !this.props.resideBrasil;
  }

  get tipoAgencia(): string | null {
    return this.props.tipoAgencia;
  }

  get enderecoAgenciaMesmoTitular(): boolean | null {
    return this.props.enderecoAgenciaMesmoTitular;
  }

  get socioVinculadoEnderecoId(): string | null {
    return this.props.socioVinculadoEnderecoId;
  }

  get bancoPais(): string | null {
    return this.props.bancoPais;
  }

  get bancoNome(): string | null {
    return this.props.bancoNome;
  }

  get bancoAgencia(): string | null {
    return this.props.bancoAgencia;
  }

  get bancoConta(): string | null {
    return this.props.bancoConta;
  }

  get bancoSwift(): string | null {
    return this.props.bancoSwift;
  }

  get tipoConta(): string | null {
    return this.props.tipoConta;
  }

  get favorecidoEhEmpresa(): boolean | null {
    return this.props.favorecidoEhEmpresa;
  }

  get favorecidoNome(): string | null {
    return this.props.favorecidoNome;
  }

  get favorecidoDoc(): string | null {
    return this.props.favorecidoDoc;
  }

  get chavePix(): string | null {
    return this.props.chavePix;
  }

  get tipoChavePix(): string | null {
    return this.props.tipoChavePix;
  }

  get tipoFaturamento(): string | null {
    return this.props.tipoFaturamento;
  }

  get percCorporativo(): number | null {
    return this.props.percCorporativo;
  }

  get percConvencional(): number | null {
    return this.props.percConvencional;
  }

  get submetidoAt(): Date | null {
    return this.props.submetidoAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): Omit<
    CadastroComplementarProps,
    "cadasturDataCadastro" | "cadasturValidade" | "submetidoAt" | "createdAt" | "updatedAt"
  > & {
    cadasturDataCadastro: string | null;
    cadasturValidade: string | null;
    submetidoAt: string | null;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      ...this.props,
      cadasturDataCadastro: this.props.cadasturDataCadastro?.toISOString() ?? null,
      cadasturValidade: this.props.cadasturValidade?.toISOString() ?? null,
      submetidoAt: this.props.submetidoAt?.toISOString() ?? null,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
