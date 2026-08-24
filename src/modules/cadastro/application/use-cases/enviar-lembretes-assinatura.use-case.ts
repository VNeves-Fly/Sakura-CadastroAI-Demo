import type { UseCase } from "@/modules/shared/application/use-case";
import {
  STATUS_AGUARDANDO_ASSINATURA,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { BiometriaVerificacaoRepository } from "@/modules/cadastro/domain/repositories/biometria-verificacao-repository";
import type { ContratoAssinaturaRepository } from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";
import type { EmailSender } from "@/modules/shared/domain/services/email-sender";
import type { IniciarVerificacaoBiometricaUseCase } from "@/modules/cadastro/application/use-cases/iniciar-verificacao-biometrica.use-case";
import type { ObterLinkAssinaturaUseCase } from "@/modules/cadastro/application/use-cases/obter-link-assinatura.use-case";

export interface EnviarLembretesAssinaturaInput {
  baseUrl: string;
}

export interface EnviarLembretesAssinaturaResult {
  lembretesBiometriaEnviados: number;
  lembretesAssinaturaEnviados: number;
}

// Rotina do cron diário (ver src/app/api/cron/lembrete-assinatura) — com o
// gate de biometria ativo, o D4Sign não notifica mais ninguém sozinho
// (skip_email:"1", ver docs/legitimuz/), então essa é a única forma dos
// sócios serem lembrados de terminar a verificação/assinatura. Sem limite
// de tentativas por enquanto (decisão do usuário: só telemetria via
// tentativasLembrete) — para sozinho quando a agência sai de
// aguardando_assinatura.
export class EnviarLembretesAssinaturaUseCase implements UseCase<
  EnviarLembretesAssinaturaInput,
  EnviarLembretesAssinaturaResult
> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly biometriaVerificacaoRepository: BiometriaVerificacaoRepository,
    private readonly contratoAssinaturaRepository: ContratoAssinaturaRepository,
    private readonly iniciarVerificacaoBiometricaUseCase: IniciarVerificacaoBiometricaUseCase,
    private readonly obterLinkAssinaturaUseCase: ObterLinkAssinaturaUseCase,
    private readonly emailSender: EmailSender,
  ) {}

  async execute(input: EnviarLembretesAssinaturaInput): Promise<EnviarLembretesAssinaturaResult> {
    const { items } = await this.agenciaRepository.listar({
      status: STATUS_AGUARDANDO_ASSINATURA,
      todos: true,
    });

    let lembretesBiometriaEnviados = 0;
    let lembretesAssinaturaEnviados = 0;

    for (const item of items) {
      if (!item.agencia.gateBiometriaAtivo) continue;

      const detalhe = await this.agenciaRepository.obterDetalhe(item.agencia.id);
      const contratoAtual = detalhe?.contratos[0];
      if (!detalhe || !contratoAtual) continue;

      const socios = detalhe.representantesLegais.filter((socio) => socio.administrativo !== false);
      const assinaturas = await this.contratoAssinaturaRepository.findByContratoId(
        contratoAtual.id,
      );

      for (const socio of socios) {
        const jaAssinou = assinaturas.some(
          (assinatura) =>
            assinatura.email.trim().toLowerCase() === socio.email.trim().toLowerCase() &&
            assinatura.assinadoEm !== null,
        );
        if (jaAssinou) continue;

        const verificacao = await this.biometriaVerificacaoRepository.buscarPorContratoIdEEmail(
          contratoAtual.id,
          socio.email,
        );

        if (verificacao?.status === "aprovado") {
          await this.reenviarLembreteAssinatura(item.agencia.id, socio.email, socio.nome);
          lembretesAssinaturaEnviados += 1;
        } else {
          await this.reenviarLembreteBiometria(
            contratoAtual.id,
            item.agencia.id,
            socio.email,
            socio.cpf,
            socio.nome,
            input.baseUrl,
          );
          if (verificacao) {
            await this.biometriaVerificacaoRepository.incrementarTentativasLembrete(verificacao.id);
          }
          lembretesBiometriaEnviados += 1;
        }
      }
    }

    return { lembretesBiometriaEnviados, lembretesAssinaturaEnviados };
  }

  private async reenviarLembreteBiometria(
    contratoId: string,
    agenciaId: string,
    email: string,
    cpf: string,
    nome: string,
    baseUrl: string,
  ): Promise<void> {
    try {
      await this.iniciarVerificacaoBiometricaUseCase.execute({
        contratoId,
        agenciaId,
        email,
        cpf,
        nome,
        baseUrl,
        disparo: "automatico",
      });
    } catch (error) {
      console.warn(
        `EnviarLembretesAssinaturaUseCase: falha ao reenviar lembrete de biometria (contratoId=${contratoId}, email=${email}): ${String(error)}`,
      );
    }
  }

  private async reenviarLembreteAssinatura(
    agenciaId: string,
    email: string,
    nome: string,
  ): Promise<void> {
    try {
      const resultado = await this.obterLinkAssinaturaUseCase.execute({ agenciaId, email });
      if (!resultado.ok) return;

      await this.emailSender.send({
        to: email,
        subject: "Lembrete — assine o contrato da sua agência",
        html: `
          <div style="font-family: sans-serif; font-size: 15px; color: #1f2937;">
            <p>Olá, ${nome}!</p>
            <p>Sua verificação de biometria já foi aprovada — falta só assinar o contrato
            da sua agência.</p>
            <p><a href="${resultado.link}">${resultado.link}</a></p>
          </div>
        `,
        meta: { origem: "lembrete-assinatura", disparo: "automatico", agenciaId },
      });
    } catch (error) {
      console.warn(
        `EnviarLembretesAssinaturaUseCase: falha ao reenviar lembrete de assinatura (agenciaId=${agenciaId}, email=${email}): ${String(error)}`,
      );
    }
  }
}
