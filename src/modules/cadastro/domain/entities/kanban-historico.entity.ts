export interface KanbanHistoricoProps {
  id: string;
  agenciaId: string;
  etapaAnterior: number | null;
  etapaNova: number | null;
  usuarioEmail: string | null;
  origem: string | null;
  observacao: string | null;
  desbloqueioManual: boolean | null;
  detalhes: string | null;
  createdAt: Date;
}

export class KanbanHistorico {
  private constructor(private readonly props: KanbanHistoricoProps) {}

  static create(props: KanbanHistoricoProps): KanbanHistorico {
    return new KanbanHistorico(props);
  }

  get id(): string {
    return this.props.id;
  }

  get agenciaId(): string {
    return this.props.agenciaId;
  }

  get etapaAnterior(): number | null {
    return this.props.etapaAnterior;
  }

  get etapaNova(): number | null {
    return this.props.etapaNova;
  }

  get usuarioEmail(): string | null {
    return this.props.usuarioEmail;
  }

  get origem(): string | null {
    return this.props.origem;
  }

  get observacao(): string | null {
    return this.props.observacao;
  }

  get desbloqueioManual(): boolean | null {
    return this.props.desbloqueioManual;
  }

  get detalhes(): string | null {
    return this.props.detalhes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): Omit<KanbanHistoricoProps, "createdAt"> & { createdAt: string } {
    return {
      ...this.props,
      createdAt: this.props.createdAt.toISOString(),
    };
  }
}
