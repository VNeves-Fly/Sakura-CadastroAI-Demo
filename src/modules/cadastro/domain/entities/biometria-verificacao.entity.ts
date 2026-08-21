import type { StatusBiometriaVerificacao } from "@/modules/cadastro/domain/enums";

export interface BiometriaVerificacaoProps {
  id: string;
  contratoId: string;
  agenciaId: string;
  email: string;
  cpf: string;
  token: string;
  status: StatusBiometriaVerificacao;
  sessionId: string | null;
  personId: string | null;
  legitimuzUrl: string | null;
  legitimuzUrlQrCode: string | null;
  tentativasLembrete: number;
  linkEnviadoEm: Date | null;
  resolvidoEm: Date | null;
  expiraEm: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class BiometriaVerificacao {
  private constructor(private readonly props: BiometriaVerificacaoProps) {}

  static create(props: BiometriaVerificacaoProps): BiometriaVerificacao {
    return new BiometriaVerificacao(props);
  }

  get id(): string {
    return this.props.id;
  }

  get contratoId(): string {
    return this.props.contratoId;
  }

  get agenciaId(): string {
    return this.props.agenciaId;
  }

  get email(): string {
    return this.props.email;
  }

  get cpf(): string {
    return this.props.cpf;
  }

  get token(): string {
    return this.props.token;
  }

  get status(): StatusBiometriaVerificacao {
    return this.props.status;
  }

  get sessionId(): string | null {
    return this.props.sessionId;
  }

  get personId(): string | null {
    return this.props.personId;
  }

  get legitimuzUrl(): string | null {
    return this.props.legitimuzUrl;
  }

  get legitimuzUrlQrCode(): string | null {
    return this.props.legitimuzUrlQrCode;
  }

  get tentativasLembrete(): number {
    return this.props.tentativasLembrete;
  }

  get expiraEm(): Date {
    return this.props.expiraEm;
  }

  get expirado(): boolean {
    return this.props.expiraEm.getTime() < Date.now();
  }

  toJSON(): Omit<
    BiometriaVerificacaoProps,
    "linkEnviadoEm" | "resolvidoEm" | "expiraEm" | "createdAt" | "updatedAt"
  > & {
    linkEnviadoEm: string | null;
    resolvidoEm: string | null;
    expiraEm: string;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      ...this.props,
      linkEnviadoEm: this.props.linkEnviadoEm?.toISOString() ?? null,
      resolvidoEm: this.props.resolvidoEm?.toISOString() ?? null,
      expiraEm: this.props.expiraEm.toISOString(),
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
