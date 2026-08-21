import type { UseCase } from "@/modules/shared/application/use-case";
import { DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type { BiometriaVerificacaoRepository } from "@/modules/cadastro/domain/repositories/biometria-verificacao-repository";
import type { ObterLinkAssinaturaUseCase } from "@/modules/cadastro/application/use-cases/obter-link-assinatura.use-case";
import type { StatusBiometriaVerificacao } from "@/modules/cadastro/domain/enums";

export interface ObterStatusBiometriaInput {
  token: string;
  // CPF digitado pelo sócio na página pública, confirmando que é ele
  // mesmo antes de mostrar qualquer coisa (decisão do usuário, 2026-08-21
  // — o token sozinho não é suficiente pra uma página que libera
  // assinatura de contrato).
  cpf: string;
}

export interface ObterStatusBiometriaResult {
  status: StatusBiometriaVerificacao;
  // Preenchido quando status é "pendente" ou "analise_manual" — link do
  // widget da Legitimuz pra (re)fazer a verificação.
  legitimuzUrl: string | null;
  // Só preenchido quando status === "aprovado" e o D4Sign já tem o link
  // disponível pra esse signatário (ver ObterLinkAssinaturaUseCase — pode
  // vir null mesmo aprovado, se o keySigner ainda não foi capturado).
  linkAssinatura: string | null;
}

function normalizarDocumento(valor: string): string {
  return valor.replace(/\D/g, "");
}

// Confirmação de CPF é feita aqui (não na camada de apresentação) pra não
// vazar, via timing ou resposta, se um token existe mas o CPF está errado
// — erro genérico nos dois casos (ver NotFoundError abaixo). Reaproveita
// ObterLinkAssinaturaUseCase (mesmo usado no botão "Ver/copiar link" do
// admin) em vez de duplicar a resolução de provedorId/keySigner.
export class ObterStatusBiometriaUseCase implements UseCase<
  ObterStatusBiometriaInput,
  ObterStatusBiometriaResult
> {
  constructor(
    private readonly biometriaVerificacaoRepository: BiometriaVerificacaoRepository,
    private readonly obterLinkAssinaturaUseCase: ObterLinkAssinaturaUseCase,
  ) {}

  async execute(input: ObterStatusBiometriaInput): Promise<ObterStatusBiometriaResult> {
    const verificacao = await this.biometriaVerificacaoRepository.buscarPorToken(input.token);

    if (!verificacao || verificacao.expirado) {
      throw new NotFoundError("Verificação de biometria");
    }

    if (normalizarDocumento(verificacao.cpf) !== normalizarDocumento(input.cpf)) {
      throw new DomainError("CPF não confere com o cadastrado pra esse link.");
    }

    if (verificacao.status !== "aprovado") {
      return {
        status: verificacao.status,
        legitimuzUrl: verificacao.legitimuzUrl,
        linkAssinatura: null,
      };
    }

    const resultado = await this.obterLinkAssinaturaUseCase.execute({
      agenciaId: verificacao.agenciaId,
      email: verificacao.email,
    });

    return {
      status: "aprovado",
      legitimuzUrl: null,
      linkAssinatura: resultado.ok ? resultado.link : null,
    };
  }
}
