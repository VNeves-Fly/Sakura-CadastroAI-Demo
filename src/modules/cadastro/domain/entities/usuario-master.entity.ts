export interface UsuarioMasterProps {
  id: string;
  agenciaId: string;
  nome: string | null;
  email: string | null;
  cpf: string | null;
  telefone: string | null;
  rg: string | null;
  rgOrgaoEmissor: string | null;
  rgUf: string | null;
  dataNascimento: Date | null;
  origemRepresentanteLegalId: string | null;
  ativo: boolean;
  salvoPor: string | null;
  salvoEm: Date | null;
  criadoEm: Date;
}

export class UsuarioMaster {
  private constructor(private readonly props: UsuarioMasterProps) {}

  static create(props: UsuarioMasterProps): UsuarioMaster {
    return new UsuarioMaster(props);
  }

  get id(): string {
    return this.props.id;
  }

  get agenciaId(): string {
    return this.props.agenciaId;
  }

  get nome(): string | null {
    return this.props.nome;
  }

  get email(): string | null {
    return this.props.email;
  }

  get cpf(): string | null {
    return this.props.cpf;
  }

  get telefone(): string | null {
    return this.props.telefone;
  }

  get rg(): string | null {
    return this.props.rg;
  }

  get rgOrgaoEmissor(): string | null {
    return this.props.rgOrgaoEmissor;
  }

  get rgUf(): string | null {
    return this.props.rgUf;
  }

  get dataNascimento(): Date | null {
    return this.props.dataNascimento;
  }

  get origemRepresentanteLegalId(): string | null {
    return this.props.origemRepresentanteLegalId;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get salvoPor(): string | null {
    return this.props.salvoPor;
  }

  get salvoEm(): Date | null {
    return this.props.salvoEm;
  }

  get criadoEm(): Date {
    return this.props.criadoEm;
  }

  toJSON(): Omit<UsuarioMasterProps, "dataNascimento" | "salvoEm" | "criadoEm"> & {
    dataNascimento: string | null;
    salvoEm: string | null;
    criadoEm: string;
  } {
    return {
      ...this.props,
      dataNascimento: this.props.dataNascimento?.toISOString() ?? null,
      salvoEm: this.props.salvoEm?.toISOString() ?? null,
      criadoEm: this.props.criadoEm.toISOString(),
    };
  }
}
