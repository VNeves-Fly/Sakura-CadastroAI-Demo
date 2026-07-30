import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { ContratoRepository } from "@/modules/cadastro/domain/repositories/contrato-repository";
import type { ContratoAssinaturaService } from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import { ProcessarWebhookD4SignUseCase } from "@/modules/cadastro/application/use-cases/processar-webhook-d4sign.use-case";

export interface RegistrarContratoExternoInput {
  contratoId: string;
  provedorId: string;
  // Sócios da agência + signatários fixos ativos, montado pelo controller
  // (mesmo jeito que dossie.view-model.ts já monta pra Fila de
  // Assinatura) — usado só pra validar que o ID colado é o documento
  // certo, nunca pra reescrever ContratoSignatario.
  emailsEsperados: string[];
}

export type RegistrarContratoExternoOutput =
  | {
      ok: true;
      nomeDocumento: string | null;
      statusName: string | null;
      webhookRegistrado: boolean;
      avisos: string[];
    }
  | { ok: false; motivo: string };

// Torna real o registro de "contrato assinado por fora da plataforma"
// (ContratoIdManual, na ficha do cadastro): confirma que o documento
// colado existe no D4Sign, confere se os destinatários batem com essa
// agência, registra nosso webhook nele (pra ele passar a seguir o mesmo
// pipeline automático dos contratos gerados por nós) e persiste
// localmente. Nunca lança pra falhas esperadas (documento não encontrado,
// destinatários não batem) — devolve { ok:false, motivo } em vez de
// estourar um erro sem tratamento no client (ver registrarContratoExternoAction
// em actions.ts).
export class RegistrarContratoExternoUseCase implements UseCase<
  RegistrarContratoExternoInput,
  RegistrarContratoExternoOutput
> {
  constructor(
    private readonly contratoRepository: ContratoRepository,
    private readonly contratoAssinaturaService: ContratoAssinaturaService,
    private readonly processarWebhookD4SignUseCase: ProcessarWebhookD4SignUseCase,
  ) {}

  async execute(input: RegistrarContratoExternoInput): Promise<RegistrarContratoExternoOutput> {
    const contrato = await this.contratoRepository.findById(input.contratoId);
    if (!contrato) {
      throw new NotFoundError("Contrato");
    }

    const documento = await this.contratoAssinaturaService.obterDocumento(input.provedorId);
    if (!documento.existe) {
      return { ok: false, motivo: "Documento não encontrado no D4Sign — confirme o ID." };
    }

    const destinatarios = await this.contratoAssinaturaService.obterDestinatarios(input.provedorId);
    const avisos: string[] = [];
    if (input.emailsEsperados.length > 0) {
      const destinatariosSet = new Set(destinatarios.map((item) => item.email.toLowerCase()));
      const bateAlgum = input.emailsEsperados.some((email) =>
        destinatariosSet.has(email.toLowerCase()),
      );
      if (!bateAlgum) {
        return {
          ok: false,
          motivo:
            "Os destinatários desse documento no D4Sign não batem com os sócios/signatários esperados desta agência — confirme se colou o ID certo.",
        };
      }

      const faltando = input.emailsEsperados.filter(
        (email) => !destinatariosSet.has(email.toLowerCase()),
      );
      if (faltando.length > 0) {
        avisos.push(
          `Alguns e-mails esperados não aparecem nos destinatários do documento: ${faltando.join(", ")}.`,
        );
      }
    }

    const { registrado: webhookRegistrado } = await this.contratoAssinaturaService.registrarWebhook(
      input.provedorId,
    );
    if (!webhookRegistrado) {
      avisos.push(
        "Webhook não registrado neste ambiente (sem URL pública configurada) — a atualização automática de status não vai funcionar até isso ser configurado.",
      );
    }

    await this.contratoRepository.atualizarProvedorId(input.contratoId, {
      provedorId: input.provedorId,
      origemGeracao: "externo",
    });

    // Heurística best-effort, não verificada ao vivo contra o D4Sign (ver
    // docs/d4sign.md): se o documento já chegou finalizado, reaproveita a
    // lógica de transição de status já existente e idempotente do
    // webhook "type_post=1" em vez de duplicá-la — falha aqui não desfaz
    // os passos acima (o webhook registrado cobre eventos futuros de
    // qualquer forma).
    const statusSugereFinalizado =
      documento.statusName !== null && !documento.statusName.toLowerCase().includes("aguardando");
    if (statusSugereFinalizado) {
      try {
        await this.processarWebhookD4SignUseCase.execute({
          provedorId: input.provedorId,
          typePost: "1",
        });
      } catch (error) {
        avisos.push(
          `Documento já parece finalizado no D4Sign, mas não deu pra atualizar o status automaticamente: ${String(error)}.`,
        );
      }
    }

    return {
      ok: true,
      nomeDocumento: documento.nomeDocumento,
      statusName: documento.statusName,
      webhookRegistrado,
      avisos,
    };
  }
}
