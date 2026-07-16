import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import {
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_EM_COMPLEMENTAR,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { ContratoAssinaturaService } from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";

interface DadosComplementaresSocio {
  nome: string;
  email: string;
  cpf: string;
}

function extrairSocios(dadosComplementares: unknown): DadosComplementaresSocio[] {
  const socios = (dadosComplementares as { socios?: unknown } | null)?.socios;
  if (!Array.isArray(socios)) return [];

  return socios.map((socio) => {
    const item = socio as Partial<DadosComplementaresSocio>;
    return { nome: item.nome ?? "", email: item.email ?? "", cpf: item.cpf ?? "" };
  });
}

// Ação do analista: um caso que a IA mandou pra fila "em_complementar"
// (algo pareceu errado) foi revisado manualmente e está tudo certo —
// aprova na mão, gera e envia o contrato (mesma integração D4Sign do
// fluxo automático) e move pra fila "aguardando_assinatura".
export class AprovarCadastroComplementarUseCase implements UseCase<string, Agencia> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly contratoAssinaturaService: ContratoAssinaturaService,
  ) {}

  async execute(id: string): Promise<Agencia> {
    const detalhe = await this.agenciaRepository.obterDetalhe(id);

    if (!detalhe) {
      throw new NotFoundError("Agência");
    }

    if (detalhe.agencia.status !== STATUS_EM_COMPLEMENTAR) {
      throw new ConflictError("Este cadastro não está na fila de complementar.");
    }

    const signatarios = extrairSocios(detalhe.dadosComplementares);

    const contratoResult = await this.contratoAssinaturaService.gerarEEnviar({
      cnpj: detalhe.agencia.cnpj,
      razaoSocial: detalhe.agencia.razaoSocial,
      signatarios,
    });

    await this.agenciaRepository.criarContrato(id, {
      provedorId: contratoResult.provedorId,
      status: contratoResult.status,
      origemGeracao: "humano",
      signatarios,
    });

    return this.agenciaRepository.atualizarStatus(id, STATUS_AGUARDANDO_ASSINATURA);
  }
}
