export interface EventoProps {
  id: string;
  nome: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Evento {
  private constructor(private readonly props: EventoProps) {}

  static create(props: EventoProps): Evento {
    return new Evento(props);
  }

  get id(): string {
    return this.props.id;
  }

  get nome(): string {
    return this.props.nome;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // JSON.stringify chama isto automaticamente (inclusive quando aninhado
  // dentro de outro objeto) — sem isso, serializar a instância exporia o
  // campo privado `props` cru em vez de um objeto plano.
  toJSON(): Omit<EventoProps, "createdAt" | "updatedAt"> & {
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: this.props.id,
      nome: this.props.nome,
      ativo: this.props.ativo,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
