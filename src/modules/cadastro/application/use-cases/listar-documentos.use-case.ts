import type { UseCase } from "@/modules/shared/application/use-case";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type { DocumentoRepository } from "@/modules/cadastro/domain/repositories/documento-repository";

export class ListarDocumentosUseCase implements UseCase<string, Documento[]> {
  constructor(private readonly documentoRepository: DocumentoRepository) {}

  execute(agenciaId: string): Promise<Documento[]> {
    return this.documentoRepository.findByAgenciaId(agenciaId);
  }
}
