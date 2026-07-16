export interface AgenciaProps {
  id: string;
  razaoSocial: string | null;
  cnpj: string | null;
  status: string | null;
  email: string | null;
  telefone: string | null;
  origem: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Representa a agência no momento do pré-cadastro (Link 1). Persistida como
// um `Cadastro` (mesma entidade que o Admin acompanha nas etapas 1-3) — não
// existe mais uma tabela `agencias` separada.
export class Agencia {
  private constructor(private readonly props: AgenciaProps) {}

  static create(props: AgenciaProps): Agencia {
    return new Agencia(props);
  }

  get id(): string {
    return this.props.id;
  }

  get razaoSocial(): string | null {
    return this.props.razaoSocial;
  }

  get cnpj(): string | null {
    return this.props.cnpj;
  }

  get status(): string {
    return this.props.status ?? "em_analise";
  }
}
