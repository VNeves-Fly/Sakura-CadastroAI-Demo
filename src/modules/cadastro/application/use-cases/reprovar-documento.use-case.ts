import type { UseCase } from "@/modules/shared/application/use-case";
import { DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type { DocumentoRepository } from "@/modules/cadastro/domain/repositories/documento-repository";

export interface ReprovarDocumentoInput {
  id: string;
  motivo: string;
  reprovadoPor: string | null;
}

// Soft-delete: NÃO apaga a linha do banco nem o arquivo (histórico de
// auditoria — quem reprovou, quando, por quê). O documento só sai do rol
// "atual" da ficha porque o dossiê sempre mostra o Documento mais
// recente de cada slot (ver documentoAtual em prisma-agencia.repository)
// — quando o cliente reenviar, a linha nova assume o lugar, sem precisar
// desta reprovada ser removida ou sobrescrita.
export class ReprovarDocumentoUseCase implements UseCase<ReprovarDocumentoInput, Documento> {
  constructor(private readonly documentoRepository: DocumentoRepository) {}

  async execute(input: ReprovarDocumentoInput): Promise<Documento> {
    const documento = await this.documentoRepository.findById(input.id);

    if (!documento) {
      throw new NotFoundError("Documento");
    }

    if (input.motivo.trim().length < 20) {
      throw new DomainError("A justificativa da reprovação precisa ter pelo menos 20 caracteres.");
    }

    return this.documentoRepository.atualizarStatus(input.id, {
      status: "REPROVADO",
      verificado: false,
      reprovadoPor: input.reprovadoPor,
      motivoReprovacao: input.motivo.trim(),
      reprovadoEm: new Date(),
      // Simetria com AprovarDocumentoUseCase (que zera reprovadoPor/
      // motivoReprovacao/reprovadoEm ao aprovar): sem isso, reverter um
      // documento já APROVADO de volta pra REPROVADO deixava
      // aprovadoPor/motivoAprovacao/aprovadoEm obsoletos na mesma linha.
      aprovadoPor: null,
      motivoAprovacao: null,
      aprovadoEm: null,
    });
  }
}
