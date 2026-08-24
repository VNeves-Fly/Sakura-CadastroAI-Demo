import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import {
  STATUS_ATIVO,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { UsuarioMasterRepository } from "@/modules/cadastro/domain/repositories/usuario-master-repository";
import type { PromotorRepository } from "@/modules/atribuicoes/domain/repositories/promotor-repository";
import type { EmailSender } from "@/modules/shared/domain/services/email-sender";
import { notificarCadastroAprovado } from "@/modules/cadastro/application/use-cases/notificar-cadastro-aprovado.util";

export interface AtualizarStatusCadastroInput {
  id: string;
  status: string;
  usuarioEmail: string;
  // Base da URL pública (obterUrlBase(headers())) — usada só quando o
  // destino é STATUS_ATIVO, pro e-mail "Cadastro aprovado" (Arte 2).
  baseUrl: string;
}

// Transições simples de status, sem efeito colateral (marcar contrato
// como assinado, ativar cliente, recusar) — todas só mudam o status.
// A única transição com efeito colateral (aprovar manualmente e gerar
// contrato) tem use-case próprio: AprovarCadastroComplementarUseCase.
export class AtualizarStatusCadastroUseCase implements UseCase<
  AtualizarStatusCadastroInput,
  Agencia
> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly usuarioMasterRepository: UsuarioMasterRepository,
    private readonly promotorRepository: PromotorRepository,
    private readonly emailSender: EmailSender,
  ) {}

  async execute(input: AtualizarStatusCadastroInput): Promise<Agencia> {
    const detalhe = await this.agenciaRepository.obterDetalhe(input.id);

    if (!detalhe) {
      throw new NotFoundError("Agência");
    }

    const agencia = await this.agenciaRepository.atualizarStatus(input.id, input.status, {
      usuarioEmail: input.usuarioEmail,
      origem: "usuario",
    });

    // Arte 2 ("Cadastro aprovado") — só na ativação final, ver
    // notificar-cadastro-aprovado.util.ts pro porquê desse ponto
    // específico (não aguardando_cadastramento).
    if (input.status === STATUS_ATIVO) {
      await notificarCadastroAprovado(
        this.emailSender,
        this.usuarioMasterRepository,
        this.promotorRepository,
        {
          id: detalhe.agencia.id,
          emailContato: detalhe.agencia.emailContato,
          executivoId: detalhe.agencia.executivoId,
        },
        input.baseUrl,
      );
    }

    return agencia;
  }
}
