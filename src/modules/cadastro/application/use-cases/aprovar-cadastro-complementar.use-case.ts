import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import {
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_EM_COMPLEMENTAR,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { ContratoAssinaturaService } from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";

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

    // `administrativo === false` é a única marca que exclui um sócio da
    // lista de signatarios — null (IA não avaliou) e true assinam (ver
    // RepresentanteLegal.administrativo no schema).
    const signatarios = detalhe.representantesLegais
      .filter((socio) => socio.administrativo !== false)
      .map((socio) => ({
        nome: socio.nome,
        email: socio.email,
        cpf: socio.cpf,
      }));

    const contratoResult = await this.contratoAssinaturaService.gerarEEnviar({
      cnpj: detalhe.agencia.cnpj,
      razaoSocial: detalhe.agencia.razaoSocial,
      origem: detalhe.agencia.origem,
      endereco: detalhe.complementar?.enderecoAgencia ?? {
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        uf: "",
      },
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
