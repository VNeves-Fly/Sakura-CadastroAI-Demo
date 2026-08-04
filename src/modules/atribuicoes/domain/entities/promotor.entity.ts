export interface PromotorProps {
  id: string;
  sica: number | null;
  nome: string;
  gestorId: string | null;
  email: string;
  telefone: string | null;
  link: string | null;
  linkExecutivoId: string[];
  bases: string[];
  userId: string | null;
}

export class Promotor {
  private constructor(private readonly props: PromotorProps) {}

  static create(props: PromotorProps): Promotor {
    return new Promotor(props);
  }

  get id(): string {
    return this.props.id;
  }

  get sica(): number | null {
    return this.props.sica;
  }

  get nome(): string {
    return this.props.nome;
  }

  get gestorId(): string | null {
    return this.props.gestorId;
  }

  get email(): string {
    return this.props.email;
  }

  get telefone(): string | null {
    return this.props.telefone;
  }

  get link(): string | null {
    return this.props.link;
  }

  get linkExecutivoId(): string[] {
    return this.props.linkExecutivoId;
  }

  get bases(): string[] {
    return this.props.bases;
  }

  get userId(): string | null {
    return this.props.userId;
  }

  get temAcesso(): boolean {
    return this.props.userId !== null;
  }

  toJSON(): PromotorProps {
    return { ...this.props };
  }
}
