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
  sicaCodigo: string | null;
  sicaSalvoPor: string | null;
  sicaSalvoEm: Date | null;
  travelLinkCriado: boolean;
  travelLinkSalvoPor: string | null;
  travelLinkSalvoEm: Date | null;
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

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get contratoSocialPath(): string {
    return this.props.contratoSocialPath;
  }

  get emailContato(): string {
    return this.props.emailContato;
  }

  get origem(): string | null {
    return this.props.origem;
  }

  get sicaCodigo(): string | null {
    return this.props.sicaCodigo;
  }

  get sicaSalvoPor(): string | null {
    return this.props.sicaSalvoPor;
  }

  get sicaSalvoEm(): Date | null {
    return this.props.sicaSalvoEm;
  }

  get travelLinkCriado(): boolean {
    return this.props.travelLinkCriado;
  }

  get travelLinkSalvoPor(): string | null {
    return this.props.travelLinkSalvoPor;
  }

  get travelLinkSalvoEm(): Date | null {
    return this.props.travelLinkSalvoEm;
  }

  toJSON(): Omit<AgenciaProps, "createdAt" | "updatedAt" | "sicaSalvoEm" | "travelLinkSalvoEm"> & {
    createdAt: string;
    updatedAt: string;
    sicaSalvoEm: string | null;
    travelLinkSalvoEm: string | null;
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
      sicaCodigo: this.props.sicaCodigo,
      sicaSalvoPor: this.props.sicaSalvoPor,
      sicaSalvoEm: this.props.sicaSalvoEm?.toISOString() ?? null,
      travelLinkCriado: this.props.travelLinkCriado,
      travelLinkSalvoPor: this.props.travelLinkSalvoPor,
      travelLinkSalvoEm: this.props.travelLinkSalvoEm?.toISOString() ?? null,
    };
  }
}
