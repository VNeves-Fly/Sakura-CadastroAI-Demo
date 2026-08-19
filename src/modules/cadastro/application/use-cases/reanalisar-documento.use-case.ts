import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import type { DocumentoRepository } from "@/modules/cadastro/domain/repositories/documento-repository";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";

export interface ReanalisarDocumentoInput {
  documentoId: string;
  reanalisadoPor: string;
}

// Reanálise interna (analista/gerente de cadastro) do MESMO arquivo já
// reprovado — cobre o caso "reprovei, mas olhando de novo devia ter sido
// aceito", sem exigir reenvio de um arquivo novo pelo sócio. Mesmo padrão de
// ReenviarDocumentoUseCase (cria uma linha nova em vez de sobrescrever, pra
// preservar o lastro do reprovado original — quem/quando/motivo continuam
// intactos naquela linha), só que aqui reaproveita o arquivo já salvo
// (gcsPath/gcsBucket) em vez de receber um upload novo. A linha nova entra
// PENDENTE e segue o Aprovar/Reprovar normal do dossiê — sem atalho de
// aprovação automática, pra manter o motivo (≥20 caracteres) sempre exigido
// nessa decisão.
export class ReanalisarDocumentoUseCase implements UseCase<ReanalisarDocumentoInput, Documento> {
  constructor(private readonly documentoRepository: DocumentoRepository) {}

  async execute(input: ReanalisarDocumentoInput): Promise<Documento> {
    const documentoReprovado = await this.documentoRepository.findById(input.documentoId);

    if (!documentoReprovado) {
      throw new NotFoundError("Documento");
    }

    if (documentoReprovado.status !== "REPROVADO") {
      throw new ConflictError("Este documento não está reprovado — nada para reanalisar.");
    }

    return this.documentoRepository.create({
      agenciaId: documentoReprovado.agenciaId,
      representanteLegalId: documentoReprovado.representanteLegalId,
      tipo: documentoReprovado.tipo,
      fileName: documentoReprovado.fileName,
      mimeType: documentoReprovado.mimeType,
      descricaoOutro: documentoReprovado.descricaoOutro,
      gcsPath: documentoReprovado.gcsPath,
      gcsBucket: documentoReprovado.gcsBucket,
      gcsSize: documentoReprovado.gcsSize,
      gcsMd5: documentoReprovado.gcsMd5,
      inseridoManualmentePor: input.reanalisadoPor,
    });
  }
}
