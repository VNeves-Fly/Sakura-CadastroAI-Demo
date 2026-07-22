import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
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
// (status PENDENTE) no banco, mas o arquivo no bucket SOBRESCREVE o
// anterior (nome fixo por slot, sem sufixo de timestamp — decisão do
// usuário: abre mão do histórico de arquivo do documento reprovado em
// troca de nunca acumular versões antigas no bucket). A linha antiga
// no banco continua existindo (fica de histórico só do registro, não
// mais do arquivo em si), e a nova passa a ser "a atual" do slot
// automaticamente, porque o dossiê sempre lê a mais recente por tipo +
// representanteLegalId (ver documentoAtual em prisma-agencia.repository).
// `agenciaId` (vem da própria URL pública, que usa o id como token — ver
// decisão do usuário) é conferido contra o documento reprovado pra
// impedir reenviar um documento de outra agência com esse endpoint.
// O arquivo é salvo em `agencias/{cnpj}/...` (não `agencias/{agenciaId}/...`)
// pra ficar na mesma pasta dos demais documentos dessa agência — por isso
// busca a Agencia aqui só pra resolver o CNPJ. O path inclui
// representanteLegalId quando presente porque `tipo` sozinho não
// distingue sócios diferentes reenviando o mesmo tipo de documento
// (ex.: RG_CNPJ de dois sócios distintos) — sem isso, o reenvio de um
// sócio sobrescreveria o do outro.
export class ReenviarDocumentoUseCase implements UseCase<ReenviarDocumentoInput, Documento> {
  constructor(
    private readonly documentoRepository: DocumentoRepository,
    private readonly agenciaRepository: AgenciaRepository,
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

    const agencia = await this.agenciaRepository.findById(documentoReprovado.agenciaId);

    if (!agencia) {
      throw new NotFoundError("Agência");
    }

    const sufixoSocio = documentoReprovado.representanteLegalId
      ? `-${documentoReprovado.representanteLegalId}`
      : "";
    const arquivoSalvo = await this.fileStorage.save(
      input.arquivo,
      `agencias/${agencia.cnpj}/reenvio-${documentoReprovado.tipo.toLowerCase()}${sufixoSocio}`,
    );

    return this.documentoRepository.create({
      agenciaId: documentoReprovado.agenciaId,
      representanteLegalId: documentoReprovado.representanteLegalId,
      tipo: documentoReprovado.tipo,
      fileName: input.arquivo.originalName,
      mimeType: input.arquivo.mimeType,
      gcsPath: arquivoSalvo.path,
      gcsBucket: arquivoSalvo.bucket,
    });
  }
}
