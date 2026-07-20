import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type { DocumentoRepository } from "@/modules/cadastro/domain/repositories/documento-repository";

// Ação do analista sobre um documento específico do cadastro
// complementar (não o cadastro inteiro) — mantém o documento no rol
// oficial da ficha, sem gerar nenhum outro efeito colateral (a decisão
// de aprovar/enviar contrato pro cadastro como um todo continua sendo
// feita à parte, em AprovarCadastroComplementarUseCase).
export class AprovarDocumentoUseCase implements UseCase<string, Documento> {
  constructor(private readonly documentoRepository: DocumentoRepository) {}

  async execute(id: string): Promise<Documento> {
    const documento = await this.documentoRepository.findById(id);

    if (!documento) {
      throw new NotFoundError("Documento");
    }

    return this.documentoRepository.atualizarStatus(id, {
      status: "APROVADO",
      verificado: true,
      reprovadoPor: null,
      motivoReprovacao: null,
      reprovadoEm: null,
    });
  }
}
