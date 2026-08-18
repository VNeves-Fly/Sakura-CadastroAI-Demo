import type { UseCase } from "@/modules/shared/application/use-case";
import { DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { EmailSender } from "@/modules/shared/domain/services/email-sender";

export interface SolicitarReenvioDocumentosInput {
  agenciaId: string;
  documentoIds: string[];
  baseUrl: string;
}

const LABEL_TIPO: Record<string, string> = {
  CONTRATO_SOCIAL: "Contrato Social",
  RG_CNPJ: "RG/CNH",
  PROCURACAO: "Procuração",
};

// Notifica a agência (e-mail de contato do cadastro) sobre os documentos
// reprovados que precisam de reenvio, com o link da página pública onde
// o cliente sobe o arquivo novo. Best-effort: se o SMTP não estiver
// configurado, EmailSender cai pro console (ver composition root) — a
// página do dossiê mostra o link mesmo assim, então o analista consegue
// copiar/colar manualmente independente do e-mail ir ou não.
export class SolicitarReenvioDocumentosUseCase implements UseCase<
  SolicitarReenvioDocumentosInput,
  void
> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly emailSender: EmailSender,
  ) {}

  async execute(input: SolicitarReenvioDocumentosInput): Promise<void> {
    if (input.documentoIds.length === 0) {
      throw new DomainError("Selecione ao menos um documento pra solicitar.");
    }

    const detalhe = await this.agenciaRepository.obterDetalhe(input.agenciaId);

    if (!detalhe) {
      throw new NotFoundError("Agência");
    }

    const idsSelecionados = new Set(input.documentoIds);
    const itens: string[] = [];

    if (detalhe.contratoSocial && idsSelecionados.has(detalhe.contratoSocial.id)) {
      itens.push(LABEL_TIPO[detalhe.contratoSocial.tipo] ?? detalhe.contratoSocial.tipo);
    }

    for (const socio of detalhe.representantesLegais) {
      if (socio.rg && idsSelecionados.has(socio.rg.id)) {
        itens.push(`${LABEL_TIPO[socio.rg.tipo] ?? socio.rg.tipo} — ${socio.nome}`);
      }
      if (socio.procuracao && idsSelecionados.has(socio.procuracao.id)) {
        itens.push(`${LABEL_TIPO[socio.procuracao.tipo] ?? socio.procuracao.tipo} — ${socio.nome}`);
      }
    }

    if (itens.length === 0) {
      throw new DomainError("Nenhum dos documentos selecionados pertence a esta agência.");
    }

    // "Info pendente" (ver comentário no schema.prisma) — liga aqui
    // independente do e-mail sair ou não: o que importa é que o analista
    // pediu, não que o aviso chegou. Desliga sozinha quando a agência
    // reenviar (gera Notificacao) ou quando o status mudar.
    await this.agenciaRepository.marcarInfoPendente(input.agenciaId);

    const link = `${input.baseUrl}/cadastro/documentos-pendentes/${input.agenciaId}`;
    const listaHtml = itens.map((item) => `<li>${item}</li>`).join("");

    // Best-effort de verdade: falha de envio (SMTP fora do ar, credencial
    // expirada, e-mail de contato inválido) não pode quebrar a página —
    // o link já fica disponível no dossiê pro analista copiar/colar na
    // mão, então o pior cenário é só não ter mandado o e-mail automático.
    try {
      await this.emailSender.send({
        to: detalhe.agencia.emailContato,
        subject: "Documentos pendentes — Cadastro Sakura",
        html: `
          <div style="font-family: sans-serif; font-size: 15px; color: #1f2937;">
            <p>Olá!</p>
            <p>Pra continuar a análise do cadastro de <strong>${detalhe.agencia.razaoSocial}</strong>,
            precisamos que os documentos abaixo sejam reenviados:</p>
            <ul>${listaHtml}</ul>
            <p><a href="${link}">${link}</a></p>
          </div>
        `,
      });
    } catch (error) {
      console.error(
        `SolicitarReenvioDocumentosUseCase: falha ao enviar e-mail pra ${detalhe.agencia.emailContato} (agenciaId=${input.agenciaId}): ${String(error)}`,
      );
    }
  }
}
