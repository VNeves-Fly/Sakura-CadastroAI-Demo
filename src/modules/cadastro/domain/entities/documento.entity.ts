import type { StatusDocumento, TipoDocumento } from "@/modules/cadastro/domain/enums";

export interface DocumentoProps {
  id: string;
  agenciaId: string;
  representanteLegalId: string | null;

  tipo: TipoDocumento;
  fileName: string | null;
  mimeType: string | null;

  gcsPath: string;
  gcsBucket: string | null;
  gcsSize: number | null;
  gcsMd5: string | null;

  status: StatusDocumento;
  verificado: boolean;
  reprovadoPor: string | null;
  motivoReprovacao: string | null;
  reprovadoEm: Date | null;
  aprovadoPor: string | null;
  motivoAprovacao: string | null;
  aprovadoEm: Date | null;
  inseridoManualmentePor: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export class Documento {
  private constructor(private readonly props: DocumentoProps) {}

  static create(props: DocumentoProps): Documento {
    return new Documento(props);
  }

  get id(): string {
    return this.props.id;
  }

  get agenciaId(): string {
    return this.props.agenciaId;
  }

  get representanteLegalId(): string | null {
    return this.props.representanteLegalId;
  }

  get tipo(): TipoDocumento {
    return this.props.tipo;
  }

  get fileName(): string | null {
    return this.props.fileName;
  }

  get mimeType(): string | null {
    return this.props.mimeType;
  }

  get gcsPath(): string {
    return this.props.gcsPath;
  }

  get gcsBucket(): string | null {
    return this.props.gcsBucket;
  }

  get gcsSize(): number | null {
    return this.props.gcsSize;
  }

  get gcsMd5(): string | null {
    return this.props.gcsMd5;
  }

  get status(): StatusDocumento {
    return this.props.status;
  }

  get verificado(): boolean {
    return this.props.verificado;
  }

  get reprovadoPor(): string | null {
    return this.props.reprovadoPor;
  }

  get motivoReprovacao(): string | null {
    return this.props.motivoReprovacao;
  }

  get reprovadoEm(): Date | null {
    return this.props.reprovadoEm;
  }

  get aprovadoPor(): string | null {
    return this.props.aprovadoPor;
  }

  get motivoAprovacao(): string | null {
    return this.props.motivoAprovacao;
  }

  get aprovadoEm(): Date | null {
    return this.props.aprovadoEm;
  }

  get inseridoManualmentePor(): string | null {
    return this.props.inseridoManualmentePor;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): Omit<DocumentoProps, "reprovadoEm" | "aprovadoEm" | "createdAt" | "updatedAt"> & {
    reprovadoEm: string | null;
    aprovadoEm: string | null;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      ...this.props,
      reprovadoEm: this.props.reprovadoEm?.toISOString() ?? null,
      aprovadoEm: this.props.aprovadoEm?.toISOString() ?? null,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
