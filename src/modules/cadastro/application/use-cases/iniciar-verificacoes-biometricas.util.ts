import type { ContratoSignatario } from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import type { IniciarVerificacaoBiometricaUseCase } from "@/modules/cadastro/application/use-cases/iniciar-verificacao-biometrica.use-case";

// Dispara a verificação de biometria (Legitimuz) pra cada sócio — best-
// effort e nunca lança: o Contrato já foi criado nesse ponto (mesmo
// racional de persistirKeySigners em assinatura-socios.util.ts), então uma
// falha aqui não pode derrubar a aprovação, só deixa aquele sócio sem
// e-mail de biometria até um reenvio manual. Chamado por
// AnalisarCadastroUseCase e AprovarCadastroComplementarUseCase, só quando
// agencia.gateBiometriaAtivo === true.
export async function iniciarVerificacoesBiometricas(
  useCase: IniciarVerificacaoBiometricaUseCase,
  contratoId: string,
  agenciaId: string,
  signatarios: ContratoSignatario[],
  baseUrl: string,
): Promise<void> {
  for (const signatario of signatarios) {
    try {
      await useCase.execute({
        contratoId,
        agenciaId,
        email: signatario.email,
        cpf: signatario.cpf,
        nome: signatario.nome,
        baseUrl,
      });
    } catch (error) {
      console.warn(
        `Falha ao iniciar verificação de biometria (contratoId=${contratoId}, email=${signatario.email}): ${String(error)}`,
      );
    }
  }
}
