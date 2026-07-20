import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import {
  paraDocumentoRevisao,
  separarDocumentosPorStatus,
  calcularProgressoTrilha,
} from "@/modules/admin/adapters/dossie.adapter";

// Orquestra tudo que a página do dossiê precisa numa chamada só: busca
// no controller (a única camada que fala com o backend) + normaliza via
// adapter — a page só destructura o resultado e renderiza, sem decidir
// nada sobre o formato do dado.
export async function obterDossieView(id: string) {
  const detalhe = await cadastroAdminController.obterDetalhe(id).catch(() => null);

  if (!detalhe) return null;

  const { agencia, complementar, representantesLegais, contratoSocial, contratos } = detalhe;
  const contratoAtual = contratos[0] ?? null;

  // Indicativo de "e-mail não entregue" (D4Sign webhook, type_post=2) —
  // por e-mail, cobre tanto os sócios quanto os signatários fixos da
  // Sakura, sem depender de terem uma linha em ContratoSignatario.
  const [emailsFalhaEntrega, signatariosPadraoAtivos] = contratoAtual
    ? await Promise.all([
        cadastroAdminController.listarEmailsFalhaEntregaContrato(contratoAtual.id),
        cadastroAdminController.listarSignatariosPadraoAtivos(),
      ])
    : [[], []];
  const emailsNaoEntregues = new Set(emailsFalhaEntrega.map((falha) => falha.email));

  const documentosParaRevisao = [
    ...paraDocumentoRevisao(contratoSocial, "Contrato Social"),
    ...representantesLegais.flatMap((socio) => [
      ...paraDocumentoRevisao(socio.rg, `RG/CNH — ${socio.nome}`),
      ...paraDocumentoRevisao(socio.procuracao, `Procuração — ${socio.nome}`),
    ]),
  ];
  const { ativos: documentosAtivos, pendentes: documentosPendentes } =
    separarDocumentosPorStatus(documentosParaRevisao);

  const { indiceAtual: indiceTrilha, recusado } = calcularProgressoTrilha(
    agencia.status,
    contratoAtual !== null,
  );

  return {
    agencia,
    complementar,
    representantesLegais,
    contratoSocial,
    contratoAtual,
    emailsNaoEntregues,
    signatariosPadraoAtivos,
    documentosAtivos,
    documentosPendentes,
    indiceTrilha,
    trilhaRecusada: recusado,
  };
}
