// "RepresentanteLegal" | "Agencia" | "CadastroComplementar" — string livre
// (ver comentário do model no schema.prisma), não um union fechado: novas
// entidades editáveis não devem exigir mudança de tipo aqui.
export type EntidadeHistoricoEdicao = string;

export interface AlteracaoCampo {
  de: string | null;
  para: string | null;
}

export interface HistoricoEdicaoCadastroProps {
  id: string;
  agenciaId: string;
  entidade: EntidadeHistoricoEdicao;
  entidadeId: string;
  alteracoes: Record<string, AlteracaoCampo>;
  justificativa: string;
  editadoPor: string;
  createdAt: Date;
}

export class HistoricoEdicaoCadastro {
  private constructor(private readonly props: HistoricoEdicaoCadastroProps) {}

  static create(props: HistoricoEdicaoCadastroProps): HistoricoEdicaoCadastro {
    return new HistoricoEdicaoCadastro(props);
  }

  get id(): string {
    return this.props.id;
  }

  get agenciaId(): string {
    return this.props.agenciaId;
  }

  get entidade(): EntidadeHistoricoEdicao {
    return this.props.entidade;
  }

  get entidadeId(): string {
    return this.props.entidadeId;
  }

  get alteracoes(): Record<string, AlteracaoCampo> {
    return this.props.alteracoes;
  }

  get justificativa(): string {
    return this.props.justificativa;
  }

  get editadoPor(): string {
    return this.props.editadoPor;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): Omit<HistoricoEdicaoCadastroProps, "createdAt"> & { createdAt: string } {
    return { ...this.props, createdAt: this.props.createdAt.toISOString() };
  }
}
