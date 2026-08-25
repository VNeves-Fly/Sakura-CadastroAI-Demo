import type { UseCase } from "@/modules/shared/application/use-case";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { IniciarVerificacaoBiometricaUseCase } from "@/modules/cadastro/application/use-cases/iniciar-verificacao-biometrica.use-case";

export interface ReenviarLinkBiometriaInput {
  agenciaId: string;
  email: string;
  baseUrl: string;
}

export type ReenviarLinkBiometriaOutput =
  { ok: true; link: string } | { ok: false; motivo: string };

// Botão "Reenviar link de biometria" na Fila de Assinatura do dossiê —
// mesmo espírito de ObterLinkAssinaturaUseCase, mas pro fluxo Legitimuz:
// resolve o sócio (cpf/nome, não vêm do front) a partir do e-mail, gera
// uma verificação nova na Legitimuz (token/sessão novos — sempre "fresh",
// nunca reaproveita um link antigo que pode ter expirado) via
// IniciarVerificacaoBiometricaUseCase (upsert, ver
// BiometriaVerificacaoRepository.criarOuSubstituir) e devolve o link pro
// analista ver/copiar — cobre os dois pedidos do usuário ("reenviar o
// e-mail" e "ver o link") numa ação só, e sobrevive a falha só do e-mail
// (SMTP fora do ar): o link continua sendo devolvido.
export class ReenviarLinkBiometriaUseCase implements UseCase<
  ReenviarLinkBiometriaInput,
  ReenviarLinkBiometriaOutput
> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly iniciarVerificacaoBiometricaUseCase: IniciarVerificacaoBiometricaUseCase,
  ) {}

  async execute(input: ReenviarLinkBiometriaInput): Promise<ReenviarLinkBiometriaOutput> {
    const detalhe = await this.agenciaRepository.obterDetalhe(input.agenciaId);
    const contratoAtual = detalhe?.contratos[0];
    if (!detalhe || !contratoAtual) {
      return { ok: false, motivo: "Nenhum contrato encontrado pra esta agência." };
    }

    const emailNormalizado = input.email.trim().toLowerCase();
    const socio = detalhe.representantesLegais.find(
      (representante) =>
        representante.administrativo !== false &&
        representante.email.trim().toLowerCase() === emailNormalizado,
    );

    if (!socio) {
      return { ok: false, motivo: "Sócio não encontrado pra esse e-mail." };
    }

    try {
      const resultado = await this.iniciarVerificacaoBiometricaUseCase.execute({
        contratoId: contratoAtual.id,
        agenciaId: input.agenciaId,
        email: socio.email,
        cpf: socio.cpf,
        nome: socio.nome,
        baseUrl: input.baseUrl,
        disparo: "manual",
      });
      return { ok: true, link: resultado.link };
    } catch (error) {
      return { ok: false, motivo: `Não foi possível gerar o link: ${String(error)}` };
    }
  }
}
