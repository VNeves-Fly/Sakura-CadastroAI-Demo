import type { AnaliseIaDocumento } from "@/modules/cadastro/domain/entities/analise-ia-documento.entity";

export interface CreateAnaliseIaDocumentoData {
  documentoId: string;
  numeroCadastur?: string | null;
  razaoSocialExtraida?: string | null;
  dataCadastroExtraida?: Date | null;
  dataValidadeExtraida?: Date | null;
  situacaoExtraida?: string | null;
  cnaeExtraido?: string | null;
  scoreConfianca?: number | null;
}

export interface AnaliseIaDocumentoRepository {
  findByDocumentoId(documentoId: string): Promise<AnaliseIaDocumento | null>;
  create(data: CreateAnaliseIaDocumentoData): Promise<AnaliseIaDocumento>;
}
