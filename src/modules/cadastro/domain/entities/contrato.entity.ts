import type { OrigemGeracaoContrato, StatusContrato } from "@/modules/cadastro/domain/enums";

export interface ContratoProps {
  id: string;
  agenciaId: string;
  provedorId: string;
  status: StatusContrato;
  origemGeracao: OrigemGeracaoContrato;

  numContrato: string | null;
  conteudoPreenchido: string | null;

  leituraConfirmada: boolean;
  leituraConfirmadaPor: string | null;
  leituraConfirmadaEm: Date | null;

  contratoGcsPath: string | null;
  pdfAssinadoGcsPath: string | null;
  assinadoAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export class Contrato {
  private constructor(private readonly props: ContratoProps) {}

  static create(props: ContratoProps): Contrato {
    return new Contrato(props);
  }

  get id(): string {
    return this.props.id;
  }

  get agenciaId(): string {
    return this.props.agenciaId;
  }

  get provedorId(): string {
    return this.props.provedorId;
  }

  get status(): StatusContrato {
    return this.props.status;
  }

  get origemGeracao(): OrigemGeracaoContrato {
    return this.props.origemGeracao;
  }

  get numContrato(): string | null {
    return this.props.numContrato;
  }

  get conteudoPreenchido(): string | null {
    return this.props.conteudoPreenchido;
  }

  get leituraConfirmada(): boolean {
    return this.props.leituraConfirmada;
  }

  get leituraConfirmadaPor(): string | null {
    return this.props.leituraConfirmadaPor;
  }

  get leituraConfirmadaEm(): Date | null {
    return this.props.leituraConfirmadaEm;
  }

  get contratoGcsPath(): string | null {
    return this.props.contratoGcsPath;
  }

  get pdfAssinadoGcsPath(): string | null {
    return this.props.pdfAssinadoGcsPath;
  }

  get assinadoAt(): Date | null {
    return this.props.assinadoAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): Omit<
    ContratoProps,
    "leituraConfirmadaEm" | "assinadoAt" | "createdAt" | "updatedAt"
  > & {
    leituraConfirmadaEm: string | null;
    assinadoAt: string | null;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      ...this.props,
      leituraConfirmadaEm: this.props.leituraConfirmadaEm?.toISOString() ?? null,
      assinadoAt: this.props.assinadoAt?.toISOString() ?? null,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
