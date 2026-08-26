import type { UseCase } from "@/modules/shared/application/use-case";
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

// ok:false em vez de lançar (CPF errado, link expirado) — decisão do
// usuário, 2026-08-26: um erro LANÇADO daqui atravessa uma Server Action
// (confirmarBiometriaAction/consultarStatusBiometriaAction, chamadas
// direto do client), e o Next.js REDACTA a mensagem de qualquer erro
// lançado em build de produção ("An error occurred in the Server
// Components render..." — digest genérico, sem a mensagem real). Isso
// fazia "CPF não confere" nunca chegar no usuário — só esse texto
// assustador. Motivo genérico nos dois casos (token inexistente/expirado
// E cpf errado) por design — não revela qual dos dois está errado.
export type ObterStatusBiometriaOutput =
  | {
      ok: true;
      status: StatusBiometriaVerificacao;
      // Preenchido quando status é "pendente" ou "analise_manual" — link
      // do widget da Legitimuz pra (re)fazer a verificação.
      legitimuzUrl: string | null;
      // Só preenchido quando status === "aprovado" e o D4Sign já tem o
      // link disponível pra esse signatário (ver ObterLinkAssinaturaUseCase
      // — pode vir null mesmo aprovado, se o keySigner ainda não foi
      // capturado).
      linkAssinatura: string | null;
    }
  | { ok: false; motivo: string };

function normalizarDocumento(valor: string): string {
  return valor.replace(/\D/g, "");
}

// Confirmação de CPF é feita aqui (não na camada de apresentação) pra não
// vazar, via timing ou resposta, se um token existe mas o CPF está errado
// — motivo genérico nos dois casos. Reaproveita ObterLinkAssinaturaUseCase
// (mesmo usado no botão "Ver/copiar link" do admin) em vez de duplicar a
// resolução de provedorId/keySigner.
export class ObterStatusBiometriaUseCase implements UseCase<
  ObterStatusBiometriaInput,
  ObterStatusBiometriaOutput
> {
  constructor(
    private readonly biometriaVerificacaoRepository: BiometriaVerificacaoRepository,
    private readonly obterLinkAssinaturaUseCase: ObterLinkAssinaturaUseCase,
  ) {}

  async execute(input: ObterStatusBiometriaInput): Promise<ObterStatusBiometriaOutput> {
    const verificacao = await this.biometriaVerificacaoRepository.buscarPorToken(input.token);

    if (!verificacao || verificacao.expirado) {
      return { ok: false, motivo: "Link inválido ou expirado. Fale com o time do seu cadastro." };
    }

    if (normalizarDocumento(verificacao.cpf) !== normalizarDocumento(input.cpf)) {
      return { ok: false, motivo: "CPF não confere com o cadastrado pra esse link." };
    }

    if (verificacao.status !== "aprovado") {
      return {
        ok: true,
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
      ok: true,
      status: "aprovado",
      legitimuzUrl: null,
      linkAssinatura: resultado.ok ? resultado.link : null,
    };
  }
}
