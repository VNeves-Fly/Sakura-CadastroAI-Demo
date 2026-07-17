export interface UsuarioMasterProps {
  id: string;
  agenciaId: string;
  nome: string | null;
  email: string | null;
  ativo: boolean;
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

  get ativo(): boolean {
    return this.props.ativo;
  }

  get criadoEm(): Date {
    return this.props.criadoEm;
  }

  toJSON(): Omit<UsuarioMasterProps, "criadoEm"> & { criadoEm: string } {
    return {
      ...this.props,
      criadoEm: this.props.criadoEm.toISOString(),
    };
  }
}
