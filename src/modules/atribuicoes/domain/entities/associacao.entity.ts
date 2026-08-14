export interface AssociacaoProps {
  id: string;
  nome: string;
  ativo: boolean;
}

// Grupo que recebe um percentual por indicar agências — uma associação
// tem várias agências, mas cada agência pertence a no máximo uma (ver
// Agencia.associacaoId no módulo cadastro).
export class Associacao {
  private constructor(private readonly props: AssociacaoProps) {}

  static create(props: AssociacaoProps): Associacao {
    return new Associacao(props);
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

  toJSON(): AssociacaoProps {
    return { ...this.props };
  }
}
