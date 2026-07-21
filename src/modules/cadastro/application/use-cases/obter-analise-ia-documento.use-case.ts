import type { UseCase } from "@/modules/shared/application/use-case";
import type { AnaliseIaDocumento } from "@/modules/cadastro/domain/entities/analise-ia-documento.entity";
import type { AnaliseIaDocumentoRepository } from "@/modules/cadastro/domain/repositories/analise-ia-documento-repository";

// Diferente de ObterDocumentoUseCase, `null` aqui é um resultado válido (o
// documento existe, mas ainda não foi analisado, ou a análise não gravou
// nada pra esse tipo) — não é um "não encontrado".
export class ObterAnaliseIaDocumentoUseCase implements UseCase<string, AnaliseIaDocumento | null> {
  constructor(private readonly analiseIaDocumentoRepository: AnaliseIaDocumentoRepository) {}

  execute(documentoId: string): Promise<AnaliseIaDocumento | null> {
    return this.analiseIaDocumentoRepository.findByDocumentoId(documentoId);
  }
}
