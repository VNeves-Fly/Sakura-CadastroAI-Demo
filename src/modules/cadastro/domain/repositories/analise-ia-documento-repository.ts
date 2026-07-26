import type { AnaliseIaDocumento } from "@/modules/cadastro/domain/entities/analise-ia-documento.entity";
import type { AnaliseIaComparacaoCampo } from "@/modules/cadastro/domain/services/document-analysis-service";

export interface CreateAnaliseIaDocumentoData {
  documentoId: string;
  camposExtraidos: Record<string, unknown>;
  camposExtras: Record<string, unknown>;
  confiancaExtracao: number;
  alertas: string[];
  resumoAnalise?: string | null;
  textoBruto?: string | null;
  formatoValido?: boolean | null;
  camposObrigatoriosPresentes?: boolean | null;
  referenciaCruzadaOk?: boolean | null;
  detalhesChecagem?: Record<string, unknown> | null;
  parecer?: string | null;
  comparacaoOficial?: AnaliseIaComparacaoCampo[] | null;
}

export interface AnaliseIaDocumentoRepository {
  findByDocumentoId(documentoId: string): Promise<AnaliseIaDocumento | null>;
  create(data: CreateAnaliseIaDocumentoData): Promise<AnaliseIaDocumento>;
}
