export interface GestorProps {
  id: string;
  nome: string;
  sica: number | null;
  email: string | null;
  telefone: string | null;
  userId: string | null;
  bases: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class Gestor {
  private constructor(private readonly props: GestorProps) {}

  static create(props: GestorProps): Gestor {
    return new Gestor(props);
  }

  get id(): string {
    return this.props.id;
  }

  get nome(): string {
    return this.props.nome;
  }

  get sica(): number | null {
    return this.props.sica;
  }

  get email(): string | null {
    return this.props.email;
  }

  get telefone(): string | null {
    return this.props.telefone;
  }

  get userId(): string | null {
    return this.props.userId;
  }

  get bases(): string[] {
    return this.props.bases;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get temAcesso(): boolean {
    return this.props.userId !== null;
  }

  toJSON(): Omit<GestorProps, "createdAt" | "updatedAt"> & {
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: this.props.id,
      nome: this.props.nome,
      sica: this.props.sica,
      email: this.props.email,
      telefone: this.props.telefone,
      userId: this.props.userId,
      bases: this.props.bases,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
