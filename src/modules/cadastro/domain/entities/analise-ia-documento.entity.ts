import type { AnaliseIaComparacaoCampo } from "@/modules/cadastro/domain/services/document-analysis-service";

export interface AnaliseIaDocumentoProps {
  id: string;
  documentoId: string;

  camposExtraidos: Record<string, unknown>;
  camposExtras: Record<string, unknown>;
  confiancaExtracao: number;
  alertas: string[];
  resumoAnalise: string | null;
  textoBruto: string | null;
  formatoValido: boolean | null;
  camposObrigatoriosPresentes: boolean | null;
  referenciaCruzadaOk: boolean | null;
  detalhesChecagem: Record<string, unknown> | null;
  parecer: string | null;
  comparacaoOficial: AnaliseIaComparacaoCampo[] | null;

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

  get camposExtraidos(): Record<string, unknown> {
    return this.props.camposExtraidos;
  }

  get camposExtras(): Record<string, unknown> {
    return this.props.camposExtras;
  }

  get confiancaExtracao(): number {
    return this.props.confiancaExtracao;
  }

  get alertas(): string[] {
    return this.props.alertas;
  }

  get resumoAnalise(): string | null {
    return this.props.resumoAnalise;
  }

  get textoBruto(): string | null {
    return this.props.textoBruto;
  }

  get formatoValido(): boolean | null {
    return this.props.formatoValido;
  }

  get camposObrigatoriosPresentes(): boolean | null {
    return this.props.camposObrigatoriosPresentes;
  }

  get referenciaCruzadaOk(): boolean | null {
    return this.props.referenciaCruzadaOk;
  }

  get detalhesChecagem(): Record<string, unknown> | null {
    return this.props.detalhesChecagem;
  }

  get parecer(): string | null {
    return this.props.parecer;
  }

  get comparacaoOficial(): AnaliseIaComparacaoCampo[] | null {
    return this.props.comparacaoOficial;
  }

  get processadoEm(): Date {
    return this.props.processadoEm;
  }

  toJSON(): Omit<AnaliseIaDocumentoProps, "processadoEm"> & { processadoEm: string } {
    return {
      ...this.props,
      processadoEm: this.props.processadoEm.toISOString(),
    };
  }
}
