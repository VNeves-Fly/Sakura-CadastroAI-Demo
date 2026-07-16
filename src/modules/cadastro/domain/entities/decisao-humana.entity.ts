import type { EtapaDecisao, ResultadoDecisao } from "@/modules/cadastro/domain/enums";

export interface DecisaoHumanaProps {
  id: string;
  agenciaId: string;
  etapa: EtapaDecisao | null;
  decisaoIa: string | null;
  decisaoHumana: ResultadoDecisao | null;
  justificativa: string | null;
  usuarioEmail: string | null;
  modeloIa: string | null;
  scoreIa: number | null;
  divergiu: boolean | null;
  createdAt: Date;
}

export class DecisaoHumana {
  private constructor(private readonly props: DecisaoHumanaProps) {}

  static create(props: DecisaoHumanaProps): DecisaoHumana {
    return new DecisaoHumana(props);
  }

  get id(): string {
    return this.props.id;
  }

  get agenciaId(): string {
    return this.props.agenciaId;
  }

  get etapa(): EtapaDecisao | null {
    return this.props.etapa;
  }

  get decisaoIa(): string | null {
    return this.props.decisaoIa;
  }

  get decisaoHumana(): ResultadoDecisao | null {
    return this.props.decisaoHumana;
  }

  get justificativa(): string | null {
    return this.props.justificativa;
  }

  get usuarioEmail(): string | null {
    return this.props.usuarioEmail;
  }

  get modeloIa(): string | null {
    return this.props.modeloIa;
  }

  get scoreIa(): number | null {
    return this.props.scoreIa;
  }

  get divergiu(): boolean | null {
    return this.props.divergiu;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): Omit<DecisaoHumanaProps, "createdAt"> & { createdAt: string } {
    return {
      ...this.props,
      createdAt: this.props.createdAt.toISOString(),
    };
  }
}
