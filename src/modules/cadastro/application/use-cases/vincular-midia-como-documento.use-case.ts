import { randomUUID } from "crypto";
import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { DocumentoRepository } from "@/modules/cadastro/domain/repositories/documento-repository";
import type { MidiaOrigemRepository } from "@/modules/cadastro/domain/repositories/midia-origem-repository";
import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
import type { DocumentoArquivoService } from "@/modules/cadastro/domain/services/documento-arquivo-service";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";

export interface VincularMidiaComoDocumentoInput {
  agenciaId: string;
  // Documento REPROVADO (slot pendente) que este arquivo resolve.
  documentoId: string;
  // MensagemMidia recebida no chat (ver mensagem-repository.ts, módulo
  // atendimento) — já foi vista/decidida pelo analista antes de vincular.
  midiaId: string;
}

// Espelha ReenviarDocumentoUseCase (mesmo padrão de "cria uma linha nova
// preservando a antiga como histórico"), só trocando a origem do arquivo
// — em vez de multipart/form-data do wizard público, vem de uma mídia já
// salva no chat — e o status final: aqui o analista já viu e decidiu no
// chat, então vincular JÁ é a aprovação (decisão do usuário, 2026-07-23),
// diferente do reenvio via wizard que sempre entra PENDENTE.
export class VincularMidiaComoDocumentoUseCase implements UseCase<
  VincularMidiaComoDocumentoInput,
  Documento
> {
  constructor(
    private readonly documentoRepository: DocumentoRepository,
    private readonly agenciaRepository: AgenciaRepository,
    private readonly fileStorage: FileStorage,
    private readonly documentoArquivoService: DocumentoArquivoService,
    private readonly midiaOrigemRepository: MidiaOrigemRepository,
  ) {}

  async execute(input: VincularMidiaComoDocumentoInput): Promise<Documento> {
    const documentoReprovado = await this.documentoRepository.findById(input.documentoId);

    if (!documentoReprovado || documentoReprovado.agenciaId !== input.agenciaId) {
      throw new NotFoundError("Documento");
    }

    if (documentoReprovado.status !== "REPROVADO") {
      throw new ConflictError("Este documento não está aguardando reenvio.");
    }

    const agencia = await this.agenciaRepository.findById(documentoReprovado.agenciaId);
    if (!agencia) throw new NotFoundError("Agência");

    const midia = await this.midiaOrigemRepository.findMidiaById(input.midiaId);
    if (!midia) throw new NotFoundError("Arquivo recebido no chat");

    const resultado = await this.documentoArquivoService.obter(midia.gcsPath, midia.gcsBucket);
    const buffer =
      resultado.tipo === "buffer"
        ? resultado.buffer
        : Buffer.from(await (await fetch(resultado.url)).arrayBuffer());
    const mimeType =
      resultado.tipo === "buffer"
        ? resultado.mimeType
        : (midia.mimeType ?? "application/octet-stream");

    const sufixoSocio = documentoReprovado.representanteLegalId
      ? `-${documentoReprovado.representanteLegalId}`
      : "";
    const arquivoSalvo = await this.fileStorage.save(
      {
        buffer,
        originalName: midia.fileName ?? input.midiaId,
        mimeType,
      },
      `agencias/${agencia.cnpj}/vinculo-chat-${documentoReprovado.tipo.toLowerCase()}${sufixoSocio}-${randomUUID()}`,
    );

    const novoDocumento = await this.documentoRepository.create({
      agenciaId: documentoReprovado.agenciaId,
      representanteLegalId: documentoReprovado.representanteLegalId,
      tipo: documentoReprovado.tipo,
      fileName: midia.fileName,
      mimeType,
      gcsPath: arquivoSalvo.path,
      gcsBucket: arquivoSalvo.bucket,
    });

    return this.documentoRepository.atualizarStatus(novoDocumento.id, {
      status: "APROVADO",
      verificado: true,
      reprovadoPor: null,
      motivoReprovacao: null,
      reprovadoEm: null,
    });
  }
}
