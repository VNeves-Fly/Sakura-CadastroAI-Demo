import type { VendaPercentual } from "@/modules/cadastro/domain/entities/venda-percentual.entity";
import type { TipoVenda } from "@/modules/cadastro/domain/enums";

export interface CreateVendaPercentualData {
  cadastroComplementarId: string;
  tipo?: TipoVenda | null;
  percentual?: number | null;
}

export interface VendaPercentualRepository {
  findByCadastroComplementarId(cadastroComplementarId: string): Promise<VendaPercentual[]>;
  // Respeita o @@unique([cadastroComplementarId, tipo]) do schema.
  upsert(data: CreateVendaPercentualData): Promise<VendaPercentual>;
}
