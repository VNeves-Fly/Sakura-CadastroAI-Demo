import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { DocumentoRepository } from "@/modules/cadastro/domain/repositories/documento-repository";
import type {
  DocumentoArquivoResultado,
  DocumentoArquivoService,
} from "@/modules/cadastro/domain/services/documento-arquivo-service";

export interface ArquivoDocumentoOutput {
  resultado: DocumentoArquivoResultado;
  fileName: string;
}

export class ObterArquivoDocumentoUseCase implements UseCase<string, ArquivoDocumentoOutput> {
  constructor(
    private readonly documentoRepository: DocumentoRepository,
    private readonly documentoArquivoService: DocumentoArquivoService,
  ) {}

  async execute(id: string): Promise<ArquivoDocumentoOutput> {
    const documento = await this.documentoRepository.findById(id);

    if (!documento) {
      throw new NotFoundError("Documento");
    }

    const resultado = await this.documentoArquivoService.obter(documento.gcsPath);
    return { resultado, fileName: documento.fileName ?? documento.gcsPath.split("/").pop()! };
  }
}
