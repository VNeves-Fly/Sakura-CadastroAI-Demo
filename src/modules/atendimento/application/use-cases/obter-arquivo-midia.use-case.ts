import { NotFoundError } from "@/modules/shared/domain/errors";
import type {
  DocumentoArquivoResultado,
  DocumentoArquivoService,
} from "@/modules/cadastro/domain/services/documento-arquivo-service";
import type { MensagemRepository } from "@/modules/atendimento/domain/repositories/mensagem-repository";

export interface ArquivoMidiaOutput {
  resultado: DocumentoArquivoResultado;
  fileName: string;
}

// Reaproveita DocumentoArquivoService (genérico o bastante — só sabe
// resolver path/bucket em buffer ou signed URL, nada específico de
// Documento) em vez de duplicar a lógica de servir arquivo do GCS/disco.
export class ObterArquivoMidiaUseCase {
  constructor(
    private readonly mensagemRepository: MensagemRepository,
    private readonly documentoArquivoService: DocumentoArquivoService,
  ) {}

  async execute(midiaId: string): Promise<ArquivoMidiaOutput> {
    const midia = await this.mensagemRepository.findMidiaById(midiaId);
    if (!midia) throw new NotFoundError("Arquivo de mídia");

    const resultado = await this.documentoArquivoService.obter(midia.gcsPath, midia.gcsBucket);
    return { resultado, fileName: midia.fileName ?? midia.gcsPath.split("/").pop()! };
  }
}
