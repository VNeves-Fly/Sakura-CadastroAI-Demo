import { randomUUID } from "crypto";
import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { DocumentoRepository } from "@/modules/cadastro/domain/repositories/documento-repository";
import type { FileStorage, StoredFileInput } from "@/modules/cadastro/domain/services/file-storage";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type { TipoDocumento } from "@/modules/cadastro/domain/enums";

export interface InserirDocumentoManualInput {
  agenciaId: string;
  // null = documento da empresa (ex.: Contrato Social); setado = documento
  // de um sócio específico (RG/CNH, Procuração).
  representanteLegalId: string | null;
  tipo: TipoDocumento;
  arquivo: StoredFileInput;
  inseridoPor: string;
  // Só preenchido quando tipo = OUTROS.
  descricaoOutro?: string | null;
  // Pula a checagem de "slot ocupado" abaixo — usado só pela atualização de
  // documentação de uma agência já finalizada (ver /arquivo/[id]), onde o
  // documento vigente normalmente está APROVADO (é isso que permitiu a
  // agência chegar em Ativo) e por isso sempre bloquearia um novo upload
  // pela regra pensada pro funil (ver comentário abaixo).
  ignorarDocumentoVigente?: boolean;
  // Idem: pula o estado PENDENTE e já entra APROVADO — mesmo padrão de
  // VincularMidiaComoDocumentoUseCase (mídia já vista/decidida antes de
  // virar Documento). Faz sentido só quando quem está inserindo já é a
  // decisão final (analista atualizando uma agência finalizada), não no
  // fluxo normal do funil, que precisa passar por
  // AprovarDocumentoUseCase/ReprovarDocumentoUseCase de novo.
  aprovarAutomaticamente?: boolean;
}

// Upload manual pelo analista direto no dossiê, preenchendo um slot vazio
// ou reprovado — diferente de VincularMidiaComoDocumentoUseCase (mídia já
// vista/decidida no chat, por isso entra direto APROVADO): aqui o analista
// está anexando um arquivo às cegas (recebido por e-mail, físico etc.),
// então entra PENDENTE e segue o mesmo caminho de decisão de sempre
// (AprovarDocumentoUseCase/ReprovarDocumentoUseCase), só que com o "quem
// enviou" registrado à parte (ver Documento.inseridoManualmentePor).
export class InserirDocumentoManualUseCase implements UseCase<
  InserirDocumentoManualInput,
  Documento
> {
  constructor(
    private readonly documentoRepository: DocumentoRepository,
    private readonly agenciaRepository: AgenciaRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: InserirDocumentoManualInput): Promise<Documento> {
    const agencia = await this.agenciaRepository.findById(input.agenciaId);
    if (!agencia) throw new NotFoundError("Agência");

    // Mesmo critério de "documento atual do slot" usado em
    // documentoAtual() (prisma-agencia.repository.ts): tipo +
    // representanteLegalId, o mais recente primeiro. Só segue se o slot
    // estiver vazio (nenhuma linha) ou se a linha atual estiver REPROVADO.
    const documentoAtualDoSlot = (await this.documentoRepository.findByAgenciaId(input.agenciaId))
      .filter(
        (documento) =>
          documento.tipo === input.tipo &&
          documento.representanteLegalId === input.representanteLegalId,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    if (
      !input.ignorarDocumentoVigente &&
      documentoAtualDoSlot &&
      documentoAtualDoSlot.status !== "REPROVADO"
    ) {
      throw new ConflictError(
        "Este documento já tem um arquivo aprovado ou aguardando decisão — não é possível inserir manualmente.",
      );
    }

    const sufixoSocio = input.representanteLegalId ? `-${input.representanteLegalId}` : "";
    const arquivoSalvo = await this.fileStorage.save(
      input.arquivo,
      `agencias/${agencia.cnpj}/manual-${input.tipo.toLowerCase()}${sufixoSocio}-${randomUUID()}`,
    );

    const novoDocumento = await this.documentoRepository.create({
      agenciaId: input.agenciaId,
      representanteLegalId: input.representanteLegalId,
      tipo: input.tipo,
      fileName: input.arquivo.originalName,
      mimeType: input.arquivo.mimeType,
      descricaoOutro: input.descricaoOutro ?? null,
      gcsPath: arquivoSalvo.path,
      gcsBucket: arquivoSalvo.bucket,
      inseridoManualmentePor: input.inseridoPor,
    });

    if (!input.aprovarAutomaticamente) return novoDocumento;

    return this.documentoRepository.atualizarStatus(novoDocumento.id, {
      status: "APROVADO",
      verificado: true,
      aprovadoPor: input.inseridoPor,
      motivoAprovacao: "Documento atualizado diretamente pelo dossiê arquivado.",
      aprovadoEm: new Date(),
    });
  }
}
