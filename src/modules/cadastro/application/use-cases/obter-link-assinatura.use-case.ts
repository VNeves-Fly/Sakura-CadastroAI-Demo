import type { UseCase } from "@/modules/shared/application/use-case";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { ContratoAssinaturaRepository } from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";
import type { ContratoAssinaturaService } from "@/modules/cadastro/domain/services/contrato-assinatura-service";

export interface ObterLinkAssinaturaInput {
  agenciaId: string;
  email: string;
}

export type ObterLinkAssinaturaOutput = { ok: true; link: string } | { ok: false; motivo: string };

// Botão "Ver/copiar link" na Fila de Assinatura do dossiê — busca o
// keySigner já persistido em ContratoAssinatura (gravado pelo webhook ou
// pelo sync manual, nunca digitado à mão) e pede o link direto de
// assinatura desse destinatário ao D4Sign.
export class ObterLinkAssinaturaUseCase implements UseCase<
  ObterLinkAssinaturaInput,
  ObterLinkAssinaturaOutput
> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly contratoAssinaturaRepository: ContratoAssinaturaRepository,
    private readonly contratoAssinaturaService: ContratoAssinaturaService,
  ) {}

  async execute(input: ObterLinkAssinaturaInput): Promise<ObterLinkAssinaturaOutput> {
    const detalhe = await this.agenciaRepository.obterDetalhe(input.agenciaId);
    const contratoAtual = detalhe?.contratos[0];
    if (!contratoAtual) {
      return { ok: false, motivo: "Nenhum contrato encontrado pra esta agência." };
    }

    const emailNormalizado = input.email.trim().toLowerCase();
    const assinaturas = await this.contratoAssinaturaRepository.findByContratoId(contratoAtual.id);
    const assinatura = assinaturas.find(
      (item) => item.email.trim().toLowerCase() === emailNormalizado,
    );

    if (!assinatura?.keySigner) {
      return {
        ok: false,
        motivo:
          'Ainda não temos o identificador desse signatário no D4Sign — clique em "Atualizar informações" e tente de novo.',
      };
    }

    try {
      const link = await this.contratoAssinaturaService.obterLinkAssinatura(
        contratoAtual.provedorId,
        assinatura.keySigner,
      );
      return { ok: true, link };
    } catch (error) {
      return { ok: false, motivo: `Não foi possível obter o link: ${String(error)}` };
    }
  }
}
