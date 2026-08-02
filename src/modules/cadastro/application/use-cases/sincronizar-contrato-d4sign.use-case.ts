import type { UseCase } from "@/modules/shared/application/use-case";
import {
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_CADASTRAMENTO,
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
// ContratoAssinatura com o que ele reportar (assinado ou não — ver
// registrar/registrarDestinatario no repositório) e roda as mesmas
// checagens de avanço de status que o webhook usa, pras duas transições
// (todos os sócios assinaram; aprovador assinou com a validação pendente).
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

    let destinatariosD4Sign;
    let socios;
    let signatariosPadraoAtivos;
    let assinaturasAntes;
    try {
      [destinatariosD4Sign, socios, signatariosPadraoAtivos, assinaturasAntes] = await Promise.all([
        this.contratoAssinaturaService.obterDestinatarios(contratoAtual.provedorId),
        this.contratoSignatarioRepository.findByContratoId(contratoAtual.id),
        this.signatarioPadraoRepository.findAtivos(),
        this.contratoAssinaturaRepository.findByContratoId(contratoAtual.id),
      ]);
    } catch (error) {
      // D4SignAdapter.request lança quando o D4Sign devolve um erro (ex.:
      // credenciais/permissão inválidas — confirmado ao vivo 2026-07-30)
      // mesmo com HTTP 200. Não deixa isso virar um "lista vazia" (que o
      // guard abaixo trataria como falha silenciosa de parsing) nem um 500
      // sem tratamento — devolve o motivo real pro analista.
      return { ok: false, motivo: `Erro ao consultar o D4Sign: ${String(error)}` };
    }

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

    const assinaturaAnteriorPorEmail = new Map(
      assinaturasAntes.map((a) => [normalizarEmail(a.email), a]),
    );

    // Atualiza no nosso sistema TODO destinatário que o D4Sign reportar
    // agora — não só quem assinou. `registrar` marca assinatura de
    // verdade (assinadoEm); `registrarDestinatario` só garante que
    // conhecemos a pessoa e o keySigner dela, sem mexer em assinadoEm
    // (necessário pra, no futuro, buscar o link de assinatura de quem
    // ainda não assinou — o D4Sign já devolve o key_signer de todo mundo
    // desde o createlist).
    let assinaturasAtualizadas = 0;
    for (const item of destinatariosD4Sign) {
      const emailNormalizado = normalizarEmail(item.email);
      const anterior = assinaturaAnteriorPorEmail.get(emailNormalizado);
      const jaAssinadoAntes = anterior?.assinadoEm != null;

      if (item.assinado === true) {
        if (!jaAssinadoAntes) assinaturasAtualizadas++;
        await this.contratoAssinaturaRepository.registrar(
          contratoAtual.id,
          item.email,
          item.keySigner,
        );
      } else {
        await this.contratoAssinaturaRepository.registrarDestinatario(
          contratoAtual.id,
          item.email,
          item.keySigner,
        );
      }

      if (anterior?.removidoDoDocumentoEm) {
        await this.contratoAssinaturaRepository.marcarRemocaoDoDocumento(
          contratoAtual.id,
          item.email,
          false,
        );
      }
    }

    // Quem já era conhecido (tinha linha) e sumiu da lista atual do D4Sign
    // — sinaliza sem apagar o histórico de quem assinou.
    for (const email of removidos) {
      const anterior = assinaturaAnteriorPorEmail.get(normalizarEmail(email));
      if (anterior && !anterior.removidoDoDocumentoEm) {
        await this.contratoAssinaturaRepository.marcarRemocaoDoDocumento(
          contratoAtual.id,
          email,
          true,
        );
      }
    }

    let avancouStatus = false;
    if (detalhe.agencia.status === STATUS_AGUARDANDO_ASSINATURA) {
      // assinadoEm !== null é obrigatório: uma linha em ContratoAssinatura
      // não significa mais "assinou" por si só (ver registrarDestinatario).
      const emailsAssinadosHistorico = assinaturasAntes
        .filter((a) => a.assinadoEm !== null)
        .map((a) => a.email);
      const emailsAssinadosAgora = destinatariosD4Sign
        .filter((item) => item.assinado === true)
        .map((item) => item.email);

      if (
        todosSociosAssinaram(
          socios.map((s) => s.email),
          [...emailsAssinadosHistorico, ...emailsAssinadosAgora],
        )
      ) {
        await this.agenciaRepository.atualizarStatus(agenciaId, STATUS_AGUARDANDO_VALIDACAO);
        avancouStatus = true;
      }
    } else if (detalhe.agencia.status === STATUS_AGUARDANDO_VALIDACAO) {
      // Mesma regra do webhook: a assinatura do aprovador com a validação
      // pendente é, em si, a aprovação formal do time de cadastro.
      const aprovador = signatariosPadraoAtivos.find((padrao) => padrao.papel === "APROVAR");
      if (aprovador?.email) {
        const emailAprovadorNormalizado = normalizarEmail(aprovador.email);
        const aprovadorJaAssinado =
          assinaturaAnteriorPorEmail.get(emailAprovadorNormalizado)?.assinadoEm != null;
        const aprovadorAssinouAgora = destinatariosD4Sign.some(
          (item) =>
            normalizarEmail(item.email) === emailAprovadorNormalizado && item.assinado === true,
        );

        if (aprovadorJaAssinado || aprovadorAssinouAgora) {
          await this.agenciaRepository.atualizarStatus(agenciaId, STATUS_AGUARDANDO_CADASTRAMENTO);
          avancouStatus = true;
        }
      }
    }

    return {
      ok: true,
      statusDocumento: documento.statusName,
      adicionados,
      removidos,
      assinaturasAtualizadas,
      avancouStatus,
    };
  }
}
