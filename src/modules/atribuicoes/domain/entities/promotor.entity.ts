export interface PromotorProps {
  id: string;
  sica: number;
  nome: string;
  gestor: string;
  email: string;
  telefone: string | null;
  link: string;
  linkExecutivoId: string[];
  base: string | null;
}

export class Promotor {
  private constructor(private readonly props: PromotorProps) {}

  static create(props: PromotorProps): Promotor {
    return new Promotor(props);
  }

  get id(): string {
    return this.props.id;
  }

  get sica(): number {
    return this.props.sica;
  }

  get nome(): string {
    return this.props.nome;
  }

  get gestor(): string {
    return this.props.gestor;
  }

  get email(): string {
    return this.props.email;
  }

  get telefone(): string | null {
    return this.props.telefone;
  }

  get link(): string {
    return this.props.link;
  }

  get linkExecutivoId(): string[] {
    return this.props.linkExecutivoId;
  }

  get base(): string | null {
    return this.props.base;
  }

  toJSON(): PromotorProps {
    return { ...this.props };
  }
}
