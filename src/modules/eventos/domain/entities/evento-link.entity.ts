export interface EventoLinkProps {
  id: string;
  eventoId: string;
  promotorId: string | null;
  associacaoId: string | null;
  ativo: boolean;
  createdAt: Date;
}

// Uma variante de link personalizado de um Evento — nunca tem os dois
// campos nulos ao mesmo tempo (validado no CriarEventoLinkUseCase, não
// aqui). Não tem rota própria: é resolvida inteiramente por querystring
// na rota pública /cadastro (`?evento=&executivo=&associacao=`).
export class EventoLink {
  private constructor(private readonly props: EventoLinkProps) {}

  static create(props: EventoLinkProps): EventoLink {
    return new EventoLink(props);
  }

  get id(): string {
    return this.props.id;
  }

  get eventoId(): string {
    return this.props.eventoId;
  }

  get promotorId(): string | null {
    return this.props.promotorId;
  }

  get associacaoId(): string | null {
    return this.props.associacaoId;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): Omit<EventoLinkProps, "createdAt"> & { createdAt: string } {
    return {
      id: this.props.id,
      eventoId: this.props.eventoId,
      promotorId: this.props.promotorId,
      associacaoId: this.props.associacaoId,
      ativo: this.props.ativo,
      createdAt: this.props.createdAt.toISOString(),
    };
  }
}
