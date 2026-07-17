export interface AnaliseIaDocumentoProps {
  id: string;
  documentoId: string;

  numeroCadastur: string | null;
  razaoSocialExtraida: string | null;
  dataCadastroExtraida: Date | null;
  dataValidadeExtraida: Date | null;
  situacaoExtraida: string | null;
  cnaeExtraido: string | null;
  scoreConfianca: number | null;

  processadoEm: Date;
}

export class AnaliseIaDocumento {
  private constructor(private readonly props: AnaliseIaDocumentoProps) {}

  static create(props: AnaliseIaDocumentoProps): AnaliseIaDocumento {
    return new AnaliseIaDocumento(props);
  }

  get id(): string {
    return this.props.id;
  }

  get documentoId(): string {
    return this.props.documentoId;
  }

  get numeroCadastur(): string | null {
    return this.props.numeroCadastur;
  }

  get razaoSocialExtraida(): string | null {
    return this.props.razaoSocialExtraida;
  }

  get dataCadastroExtraida(): Date | null {
    return this.props.dataCadastroExtraida;
  }

  get dataValidadeExtraida(): Date | null {
    return this.props.dataValidadeExtraida;
  }

  get situacaoExtraida(): string | null {
    return this.props.situacaoExtraida;
  }

  get cnaeExtraido(): string | null {
    return this.props.cnaeExtraido;
  }

  get scoreConfianca(): number | null {
    return this.props.scoreConfianca;
  }

  get processadoEm(): Date {
    return this.props.processadoEm;
  }

  toJSON(): Omit<
    AnaliseIaDocumentoProps,
    "dataCadastroExtraida" | "dataValidadeExtraida" | "processadoEm"
  > & {
    dataCadastroExtraida: string | null;
    dataValidadeExtraida: string | null;
    processadoEm: string;
  } {
    return {
      ...this.props,
      dataCadastroExtraida: this.props.dataCadastroExtraida?.toISOString() ?? null,
      dataValidadeExtraida: this.props.dataValidadeExtraida?.toISOString() ?? null,
      processadoEm: this.props.processadoEm.toISOString(),
    };
  }
}
