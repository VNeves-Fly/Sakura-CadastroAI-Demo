import { randomBytes } from "node:crypto";
import type { UseCase } from "@/modules/shared/application/use-case";
import type { EmailSender } from "@/modules/shared/domain/services/email-sender";
import type { BiometriaVerificacaoService } from "@/modules/cadastro/domain/services/biometria-verificacao-service";
import type { BiometriaVerificacaoRepository } from "@/modules/cadastro/domain/repositories/biometria-verificacao-repository";

export interface IniciarVerificacaoBiometricaInput {
  contratoId: string;
  agenciaId: string;
  email: string;
  cpf: string;
  nome: string;
  baseUrl: string;
}

const DIAS_EXPIRACAO_TOKEN = 7;

// Gera o token de acesso (opaco, não reaproveita nenhum id existente —
// decisão do usuário: essa página libera uma assinatura de contrato de
// verdade, merece controle de acesso melhor que um id adivinhável, ver
// docs/legitimuz/), inicia a verificação na Legitimuz (flow kyc-faceindex)
// e manda o e-mail com o link pro sócio. Chamado por
// assinatura-socios.util.ts (logo após gerarEEnviar, um por sócio), pelo
// botão manual "Reenviar link de biometria" e pelo cron de lembrete diário
// — nos três casos, best-effort no nível do CALLER (aqui pode lançar).
export class IniciarVerificacaoBiometricaUseCase implements UseCase<
  IniciarVerificacaoBiometricaInput,
  void
> {
  constructor(
    private readonly biometriaVerificacaoService: BiometriaVerificacaoService,
    private readonly biometriaVerificacaoRepository: BiometriaVerificacaoRepository,
    private readonly emailSender: EmailSender,
  ) {}

  async execute(input: IniciarVerificacaoBiometricaInput): Promise<void> {
    const token = randomBytes(32).toString("hex");
    const redirectUrl = `${input.baseUrl}/cadastro/biometria/${token}`;
    const expiraEm = new Date(Date.now() + DIAS_EXPIRACAO_TOKEN * 24 * 60 * 60 * 1000);

    const resultado = await this.biometriaVerificacaoService.iniciarVerificacao({
      cpf: input.cpf,
      refId: token,
      redirectUrl,
    });

    await this.biometriaVerificacaoRepository.criarOuSubstituir({
      contratoId: input.contratoId,
      agenciaId: input.agenciaId,
      email: input.email,
      cpf: input.cpf,
      token,
      sessionId: resultado.sessionId,
      personId: resultado.personId,
      legitimuzUrl: resultado.url,
      legitimuzUrlQrCode: resultado.urlQrCode,
      expiraEm,
    });

    await this.emailSender.send({
      to: input.email,
      subject: "Verificação de biometria facial — Cadastro Sakura",
      html: `
        <div style="font-family: sans-serif; font-size: 15px; color: #1f2937;">
          <p>Olá, ${input.nome}!</p>
          <p>Falta pouco pra assinar o contrato da sua agência. Antes de assinar,
          precisamos confirmar sua identidade com uma verificação rápida de
          biometria facial (uma selfie).</p>
          <p><a href="${redirectUrl}">${redirectUrl}</a></p>
          <p>Assim que a verificação for aprovada, você recebe o link pra
          assinar o contrato.</p>
        </div>
      `,
    });
  }
}
