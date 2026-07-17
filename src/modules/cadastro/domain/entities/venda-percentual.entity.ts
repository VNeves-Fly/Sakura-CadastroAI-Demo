import type { TipoVenda } from "@/modules/cadastro/domain/enums";

export interface VendaPercentualProps {
  id: string;
  cadastroComplementarId: string;
  tipo: TipoVenda | null;
  percentual: number | null;
}

export class VendaPercentual {
  private constructor(private readonly props: VendaPercentualProps) {}

  static create(props: VendaPercentualProps): VendaPercentual {
    return new VendaPercentual(props);
  }

  get id(): string {
    return this.props.id;
  }

  get cadastroComplementarId(): string {
    return this.props.cadastroComplementarId;
  }

  get tipo(): TipoVenda | null {
    return this.props.tipo;
  }

  get percentual(): number | null {
    return this.props.percentual;
  }

  toJSON(): VendaPercentualProps {
    return { ...this.props };
  }
}
