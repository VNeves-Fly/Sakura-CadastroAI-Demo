import type { UseCase } from "@/modules/shared/application/use-case";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { ContratoAssinaturaRepository } from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";
import type { ContratoAssinaturaService } from "@/modules/cadastro/domain/services/contrato-assinatura-service";

export interface ObterLinkAssinaturaInput {
  agenciaId: string;
  email: string;
}

export type ObterLinkAssinaturaOutput = { ok: true; link: string } | { ok: false; motivo: string };

// Botão "Ver/copiar link" na Fila de Assinatura do dossiê (e a página
// pública de biometria, ver ObterStatusBiometriaUseCase) — busca o
// keySigner já persistido em ContratoAssinatura (gravado pelo webhook ou
// pelo sync manual) e pede o link direto de assinatura desse
// destinatário ao D4Sign.
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

    let keySigner = assinatura?.keySigner ?? null;

    if (!keySigner) {
      // Autocura: `persistirKeySigners` (chamado na geração do contrato)
      // é best-effort e pode falhar silenciosamente, deixando o
      // signatário sem keySigner — antes só um analista clicando
      // "Atualizar informações" (SincronizarContratoD4SignUseCase)
      // resolvia isso. Decisão do usuário, 2026-08-27: não pode depender
      // de ação manual — busca direto do D4Sign aqui mesmo antes de
      // desistir (mesma chamada que o sync manual usa).
      try {
        const destinatarios = await this.contratoAssinaturaService.obterDestinatarios(
          contratoAtual.provedorId,
        );
        const destinatario = destinatarios.find(
          (item) => item.email.trim().toLowerCase() === emailNormalizado,
        );
        if (destinatario?.keySigner) {
          await this.contratoAssinaturaRepository.registrarDestinatario(
            contratoAtual.id,
            destinatario.email,
            destinatario.keySigner,
          );
          keySigner = destinatario.keySigner;
        }
      } catch (error) {
        console.warn(
          `ObterLinkAssinaturaUseCase: falha ao tentar autocurar keySigner via D4Sign (contratoId=${contratoAtual.id}, email=${input.email}): ${String(error)}`,
        );
      }
    }

    if (!keySigner) {
      return {
        ok: false,
        motivo:
          "Ainda não temos o identificador desse signatário no D4Sign — tente de novo em instantes.",
      };
    }

    try {
      const link = await this.contratoAssinaturaService.obterLinkAssinatura(
        contratoAtual.provedorId,
        keySigner,
      );
      return { ok: true, link };
    } catch (error) {
      return { ok: false, motivo: `Não foi possível obter o link: ${String(error)}` };
    }
  }
}
