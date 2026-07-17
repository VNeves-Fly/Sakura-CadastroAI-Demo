import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type { DocumentoRepository } from "@/modules/cadastro/domain/repositories/documento-repository";

export class ObterDocumentoUseCase implements UseCase<string, Documento> {
  constructor(private readonly documentoRepository: DocumentoRepository) {}

  async execute(id: string): Promise<Documento> {
    const documento = await this.documentoRepository.findById(id);

    if (!documento) {
      throw new NotFoundError("Documento");
    }

    return documento;
  }
}
