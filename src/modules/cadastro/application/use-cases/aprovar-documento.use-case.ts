import type { UseCase } from "@/modules/shared/application/use-case";
import { DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type { DocumentoRepository } from "@/modules/cadastro/domain/repositories/documento-repository";

export interface AprovarDocumentoInput {
  id: string;
  motivo: string;
  aprovadoPor: string | null;
}

// Ação do analista sobre um documento específico do cadastro
// complementar (não o cadastro inteiro) — mantém o documento no rol
// oficial da ficha, sem gerar nenhum outro efeito colateral (a decisão
// de aprovar/enviar contrato pro cadastro como um todo continua sendo
// feita à parte, em AprovarCadastroComplementarUseCase).
//
// Exige motivo igual à reprovação (ver ReprovarDocumentoUseCase) — decisão
// do usuário, 2026-07-26: se um analista está aprovando manualmente em vez
// de deixar a IA seguir sozinha, algo levou a essa exceção, e isso precisa
// ficar registrado (quem, quando, por quê) do mesmo jeito que uma
// reprovação já fica.
export class AprovarDocumentoUseCase implements UseCase<AprovarDocumentoInput, Documento> {
  constructor(private readonly documentoRepository: DocumentoRepository) {}

  async execute(input: AprovarDocumentoInput): Promise<Documento> {
    const documento = await this.documentoRepository.findById(input.id);

    if (!documento) {
      throw new NotFoundError("Documento");
    }

    if (input.motivo.trim().length < 20) {
      throw new DomainError("A justificativa da aprovação precisa ter pelo menos 20 caracteres.");
    }

    return this.documentoRepository.atualizarStatus(input.id, {
      status: "APROVADO",
      verificado: true,
      aprovadoPor: input.aprovadoPor,
      motivoAprovacao: input.motivo.trim(),
      aprovadoEm: new Date(),
      reprovadoPor: null,
      motivoReprovacao: null,
      reprovadoEm: null,
    });
  }
}
