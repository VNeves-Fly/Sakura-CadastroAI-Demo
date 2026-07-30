import type { UseCase } from "@/modules/shared/application/use-case";
import {
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_VALIDACAO,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { ContratoSignatarioRepository } from "@/modules/cadastro/domain/repositories/contrato-signatario-repository";
import type { SignatarioPadraoRepository } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";
import type { ContratoAssinaturaRepository } from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";
import type { ContratoAssinaturaService } from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import { todosSociosAssinaram } from "@/modules/cadastro/domain/services/assinatura-socios.util";

export type SincronizarContratoD4SignOutput =
  | {
      ok: true;
      statusDocumento: string | null;
      adicionados: string[];
      removidos: string[];
      assinaturasAtualizadas: number;
      avancouStatus: boolean;
    }
  | { ok: false; motivo: string };

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Sync manual sob demanda (botão "Atualizar informações" na Fila de
// Assinatura) — mudanças feitas direto no painel do D4Sign (ex.: editar
// quem assina) não passam pelos eventos que nosso webhook escuta
// (type_post 1/2/3/4), então sem esse botão não temos como perceber que a
// lista de destinatários mudou por fora. Também serve de rede de segurança
// se um webhook individual se perder: reconsulta o D4Sign, backfilla
// ContratoAssinatura com o que ele reportar como assinado (melhor esforço,
// ver D4SignAdapter.obterDestinatarios) e roda a mesma checagem de "todos
// os sócios assinaram" que o webhook usa.
export class SincronizarContratoD4SignUseCase implements UseCase<
  string,
  SincronizarContratoD4SignOutput
> {
  constructor(
    private readonly agenciaRepository: AgenciaRepository,
    private readonly contratoAssinaturaService: ContratoAssinaturaService,
    private readonly contratoSignatarioRepository: ContratoSignatarioRepository,
    private readonly signatarioPadraoRepository: SignatarioPadraoRepository,
    private readonly contratoAssinaturaRepository: ContratoAssinaturaRepository,
  ) {}

  async execute(agenciaId: string): Promise<SincronizarContratoD4SignOutput> {
    const detalhe = await this.agenciaRepository.obterDetalhe(agenciaId);
    if (!detalhe) {
      return { ok: false, motivo: "Agência não encontrada." };
    }

    const contratoAtual = detalhe.contratos[0];
    if (!contratoAtual) {
      return { ok: false, motivo: "Nenhum contrato encontrado pra esta agência." };
    }

    const documento = await this.contratoAssinaturaService.obterDocumento(contratoAtual.provedorId);
    if (!documento.existe) {
      return { ok: false, motivo: "Documento não encontrado no D4Sign." };
    }

    const [destinatariosD4Sign, socios, signatariosPadraoAtivos, assinaturasAntes] =
      await Promise.all([
        this.contratoAssinaturaService.obterDestinatarios(contratoAtual.provedorId),
        this.contratoSignatarioRepository.findByContratoId(contratoAtual.id),
        this.signatarioPadraoRepository.findAtivos(),
        this.contratoAssinaturaRepository.findByContratoId(contratoAtual.id),
      ]);

    const emailsEsperados = [
      ...socios.map((socio) => socio.email),
      ...signatariosPadraoAtivos
        .filter((padrao) => padrao.email)
        .map((padrao) => padrao.email as string),
    ];

    // Lista vazia com destinatários esperados > 0 é sinal de falha de
    // leitura (formato de resposta do D4Sign não reconhecido, ver
    // D4SignAdapter.obterDestinatarios) muito mais provável que "todo mundo
    // foi removido de verdade" — reportar isso como "removidos" seria um
    // alarme falso perigoso. Não avança nada nesse caso.
    if (destinatariosD4Sign.length === 0 && emailsEsperados.length > 0) {
      return {
        ok: false,
        motivo:
          "O D4Sign não retornou nenhum destinatário pra esse documento — provavelmente falha de leitura da API (formato de resposta não reconhecido), não uma remoção real. Nada foi alterado; avise o time técnico.",
      };
    }

    const esperadosNormalizados = new Set(emailsEsperados.map(normalizarEmail));
    const destinatariosNormalizados = new Set(
      destinatariosD4Sign.map((item) => normalizarEmail(item.email)),
    );

    const adicionados = destinatariosD4Sign
      .filter((item) => !esperadosNormalizados.has(normalizarEmail(item.email)))
      .map((item) => item.email);
    const removidos = emailsEsperados.filter(
      (email) => !destinatariosNormalizados.has(normalizarEmail(email)),
    );

    const assinadosAntesNormalizados = new Set(
      assinaturasAntes.map((a) => normalizarEmail(a.email)),
    );
    const novosAssinados = destinatariosD4Sign.filter(
      (item) =>
        item.assinado === true && !assinadosAntesNormalizados.has(normalizarEmail(item.email)),
    );
    for (const item of novosAssinados) {
      await this.contratoAssinaturaRepository.registrar(contratoAtual.id, item.email);
    }

    let avancouStatus = false;
    if (detalhe.agencia.status === STATUS_AGUARDANDO_ASSINATURA) {
      const emailsAssinados = [
        ...assinaturasAntes.map((a) => a.email),
        ...novosAssinados.map((item) => item.email),
      ];
      if (
        todosSociosAssinaram(
          socios.map((s) => s.email),
          emailsAssinados,
        )
      ) {
        await this.agenciaRepository.atualizarStatus(agenciaId, STATUS_AGUARDANDO_VALIDACAO);
        avancouStatus = true;
      }
    }

    return {
      ok: true,
      statusDocumento: documento.statusName,
      adicionados,
      removidos,
      assinaturasAtualizadas: novosAssinados.length,
      avancouStatus,
    };
  }
}
