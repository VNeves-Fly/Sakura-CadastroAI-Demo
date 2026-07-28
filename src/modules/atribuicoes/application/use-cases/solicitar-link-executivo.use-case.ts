import type { UseCase } from "@/modules/shared/application/use-case";
import type { EmailSender } from "@/modules/shared/domain/services/email-sender";
import type { PromotorRepository } from "@/modules/atribuicoes/domain/repositories/promotor-repository";

export interface SolicitarLinkExecutivoInput {
  email: string;
  baseUrl: string;
}

export interface SolicitarLinkExecutivoOutput {
  encontrado: boolean;
}

function buildHtml(nome: string, link: string): string {
  const primeiroNome = nome.split(" ")[0];
  return `
    <div style="font-family: sans-serif; font-size: 15px; color: #1f2937;">
      <p>Olá, ${primeiroNome}!</p>
      <p>Aqui está o seu link personalizado de cadastro na Sakura Consolidadora:</p>
      <p><a href="${link}">${link}</a></p>
      <p>Use este link sempre que for cadastrar ou atualizar uma agência da sua carteira.</p>
    </div>
  `;
}

// Diferente de RequestPasswordResetUseCase, aqui a resposta REVELA se o
// e-mail existe — decisão explícita do produto: a página pública mostra
// mensagens diferentes na hora ("enviamos seu link" vs. "fale com seu
// gestor"). Não há dado sensível envolvido (só o roster interno de
// promotores), então o trade-off de enumeração foi aceito conscientemente.
export class SolicitarLinkExecutivoUseCase implements UseCase<
  SolicitarLinkExecutivoInput,
  SolicitarLinkExecutivoOutput
> {
  constructor(
    private readonly promotorRepository: PromotorRepository,
    private readonly emailSender: EmailSender,
  ) {}

  async execute(input: SolicitarLinkExecutivoInput): Promise<SolicitarLinkExecutivoOutput> {
    const promotor = await this.promotorRepository.findByEmail(input.email);

    if (!promotor) {
      return { encontrado: false };
    }

    const link = `${input.baseUrl}/cadastro?executivo=${promotor.id}`;

    // E-mail é best-effort: falha no envio não pode derrubar o fluxo nem
    // mudar a resposta (mesma postura de RequestPasswordResetUseCase).
    try {
      await this.emailSender.send({
        to: promotor.email,
        subject: "Seu link de cadastro — Sakura Consolidadora",
        html: buildHtml(promotor.nome, link),
      });
    } catch (error) {
      console.error("Falha ao enviar e-mail de link do executivo:", error);
    }

    return { encontrado: true };
  }
}
