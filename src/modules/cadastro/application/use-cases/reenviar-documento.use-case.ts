import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import type { DocumentoRepository } from "@/modules/cadastro/domain/repositories/documento-repository";
import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type { UploadedFileInput } from "@/modules/cadastro/application/dto/finalizar-cadastro.dto";

export interface ReenviarDocumentoInput {
  agenciaId: string;
  documentoId: string;
  arquivo: UploadedFileInput;
}

// Reenvio público de um documento reprovado — cria uma linha NOVA
// (status PENDENTE), nunca sobrescreve ou apaga a reprovada (fica de
// histórico). Essa linha nova passa a ser "a atual" do slot
// automaticamente, porque o dossiê sempre lê a mais recente por tipo +
// representanteLegalId (ver documentoAtual em prisma-agencia.repository).
// `agenciaId` (vem da própria URL pública, que usa o id como token — ver
// decisão do usuário) é conferido contra o documento reprovado pra
// impedir reenviar um documento de outra agência com esse endpoint.
export class ReenviarDocumentoUseCase implements UseCase<ReenviarDocumentoInput, Documento> {
  constructor(
    private readonly documentoRepository: DocumentoRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: ReenviarDocumentoInput): Promise<Documento> {
    const documentoReprovado = await this.documentoRepository.findById(input.documentoId);

    if (!documentoReprovado || documentoReprovado.agenciaId !== input.agenciaId) {
      throw new NotFoundError("Documento");
    }

    if (documentoReprovado.status !== "REPROVADO") {
      throw new ConflictError("Este documento não está aguardando reenvio.");
    }

    const gcsPath = await this.fileStorage.save(
      input.arquivo,
      `agencias/${input.agenciaId}/reenvio-${documentoReprovado.tipo.toLowerCase()}`,
    );

    return this.documentoRepository.create({
      agenciaId: documentoReprovado.agenciaId,
      representanteLegalId: documentoReprovado.representanteLegalId,
      tipo: documentoReprovado.tipo,
      fileName: input.arquivo.originalName,
      mimeType: input.arquivo.mimeType,
      gcsPath,
    });
  }
}
