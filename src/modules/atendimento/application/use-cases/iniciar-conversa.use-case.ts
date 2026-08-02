import type { UseCase } from "@/modules/shared/application/use-case";
import type { IniciarConversaInput } from "@/modules/atendimento/application/dto/iniciar-conversa.dto";
import { completarConversa } from "@/modules/atendimento/application/shared/completar-conversa";
import { garantirAtendimentoAssumido } from "@/modules/atendimento/application/shared/garantir-atendimento-assumido";
import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import type { AtendimentoAgenciaRepository } from "@/modules/atendimento/domain/repositories/atendimento-agencia-repository";
import type { ConversaRepository } from "@/modules/atendimento/domain/repositories/conversa-repository";
import type { ResumoFichaClienteRepository } from "@/modules/atendimento/domain/repositories/resumo-ficha-cliente-repository";

// Disparada pelo analista a partir da lista de Contatos ou do modal "com
// quem falar" (nunca de mensagem inbound, ver ReceberMensagemWhatsAppUseCase
// pro caminho existente). Idempotente: se já existe uma Conversa pra esse
// telefone, devolve ela em vez de duplicar — importante porque o analista
// pode clicar de novo num número que só recebeu mensagem entre o momento
// em que a lista carregou e o clique. Exige atendimento da agência já
// assumido (decisão do usuário, 2026-07-28) — iniciar conversa é uma das
// ações travadas até assumir.
export class IniciarConversaUseCase implements UseCase<IniciarConversaInput, ConversaEntity> {
  constructor(
    private readonly conversaRepository: ConversaRepository,
    private readonly resumoFichaClienteRepository: ResumoFichaClienteRepository,
    private readonly atendimentoAgenciaRepository: AtendimentoAgenciaRepository,
  ) {}

  async execute(input: IniciarConversaInput): Promise<ConversaEntity> {
    await garantirAtendimentoAssumido(
      this.atendimentoAgenciaRepository,
      input.agenciaId,
      input.analistaId,
    );

    const existente = await this.conversaRepository.findByTelefoneWhatsapp(input.telefoneWhatsapp);
    const conversa =
      existente ??
      (await this.conversaRepository.create({
        telefoneWhatsapp: input.telefoneWhatsapp,
        tipoContato: "agencia",
        agenciaId: input.agenciaId,
        representanteLegalId: input.representanteLegalId,
        membroNome: input.membroNome,
        membroPapel: input.membroPapel,
        membroTelefone: input.telefoneWhatsapp,
      }));

    return completarConversa(conversa, this.resumoFichaClienteRepository);
  }
}
