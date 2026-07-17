export interface NotificacaoProps {
  id: string;
  agenciaId: string;
  tipo: string | null;
  titulo: string | null;
  mensagem: string | null;
  createdAt: Date;
}

export class Notificacao {
  private constructor(private readonly props: NotificacaoProps) {}

  static create(props: NotificacaoProps): Notificacao {
    return new Notificacao(props);
  }

  get id(): string {
    return this.props.id;
  }

  get agenciaId(): string {
    return this.props.agenciaId;
  }

  get tipo(): string | null {
    return this.props.tipo;
  }

  get titulo(): string | null {
    return this.props.titulo;
  }

  get mensagem(): string | null {
    return this.props.mensagem;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): Omit<NotificacaoProps, "createdAt"> & { createdAt: string } {
    return {
      ...this.props,
      createdAt: this.props.createdAt.toISOString(),
    };
  }
}
