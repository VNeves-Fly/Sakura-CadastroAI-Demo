export interface ContratoAssinaturaProps {
  id: string;
  contratoId: string;
  email: string;
  // null = destinatário conhecido (o D4Sign já listou, via createlist ou
  // /list) mas ainda não assinou — ver registrarDestinatario no
  // repositório. Todo código que decide "quem já assinou" precisa checar
  // `assinadoEm !== null`, nunca inferir isso só da linha existir.
  assinadoEm: Date | null;
  keySigner: string | null;
  removidoDoDocumentoEm: Date | null;
}

export class ContratoAssinatura {
  private constructor(private readonly props: ContratoAssinaturaProps) {}

  static create(props: ContratoAssinaturaProps): ContratoAssinatura {
    return new ContratoAssinatura(props);
  }

  get id(): string {
    return this.props.id;
  }

  get contratoId(): string {
    return this.props.contratoId;
  }

  get email(): string {
    return this.props.email;
  }

  get assinadoEm(): Date | null {
    return this.props.assinadoEm;
  }

  get keySigner(): string | null {
    return this.props.keySigner;
  }

  get removidoDoDocumentoEm(): Date | null {
    return this.props.removidoDoDocumentoEm;
  }

  toJSON(): Omit<ContratoAssinaturaProps, "assinadoEm" | "removidoDoDocumentoEm"> & {
    assinadoEm: string | null;
    removidoDoDocumentoEm: string | null;
  } {
    return {
      ...this.props,
      assinadoEm: this.props.assinadoEm?.toISOString() ?? null,
      removidoDoDocumentoEm: this.props.removidoDoDocumentoEm?.toISOString() ?? null,
    };
  }
}
