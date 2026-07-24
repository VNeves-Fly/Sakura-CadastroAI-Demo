import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import {
  paraDocumentoRevisao,
  historicoDoSlot,
  separarDocumentosPorStatus,
  calcularProgressoTrilha,
  montarFilaAssinatura,
  paraAnaliseIaResumo,
  paraParecerView,
} from "@/modules/admin/adapters/dossie.adapter";

// Orquestra tudo que a página do dossiê precisa numa chamada só: busca
// no controller (a única camada que fala com o backend) + normaliza via
// adapter — a page só destructura o resultado e renderiza, sem decidir
// nada sobre o formato do dado.
export async function obterDossieView(id: string) {
  const detalhe = await cadastroAdminController.obterDetalhe(id).catch(() => null);

  if (!detalhe) return null;

  const { agencia, complementar, representantesLegais, contratoSocial, contratos, analiseIa } =
    detalhe;
  const contratoAtual = contratos[0] ?? null;
  const parecerIa = paraParecerView(analiseIa);

  // Indicativo de "e-mail não entregue" (D4Sign webhook, type_post=2) —
  // por e-mail, cobre tanto os sócios quanto os signatários fixos da
  // Sakura, sem depender de terem uma linha em ContratoSignatario.
  // Análise de IA (contrato social + RG de cada sócio) já é gravada de
  // verdade pelo FinalizarCadastroUseCase — aqui só lê de volta pra
  // mostrar no dossiê, algo que nenhum use-case fazia até agora.
  const [
    emailsFalhaEntrega,
    signatariosPadraoAtivos,
    analiseContratoSocialRaw,
    analisesSociosRaw,
    dadosReceita,
    usuarioMaster,
    todosDocumentos,
  ] = await Promise.all([
    contratoAtual
      ? cadastroAdminController.listarEmailsFalhaEntregaContrato(contratoAtual.id)
      : Promise.resolve([]),
    contratoAtual ? cadastroAdminController.listarSignatariosPadraoAtivos() : Promise.resolve([]),
    contratoSocial
      ? cadastroAdminController.obterAnaliseDocumento(contratoSocial.id)
      : Promise.resolve(null),
    Promise.all(
      representantesLegais.map((socio) =>
        socio.rg
          ? cadastroAdminController.obterAnaliseDocumento(socio.rg.id)
          : Promise.resolve(null),
      ),
    ),
    // Só existe pra cadastros criados depois da funcionalidade "Dados da
    // Receita" — null é o estado normal de agência mais antiga.
    cadastroAdminController.obterDadosReceita(agencia.id),
    // null = analista ainda não salvou o Usuário Master pra essa agência.
    cadastroAdminController.obterUsuarioMaster(agencia.id),
    // Todas as linhas de Documento da agência (não só "a atual" de cada
    // slot) — reaproveitado só pra montar o histórico de versões
    // antigas/reprovadas (ver historicoDoSlot), nenhuma query nova.
    cadastroAdminController.listarDocumentos(agencia.id),
  ]);
  const emailsNaoEntregues = new Set(emailsFalhaEntrega.map((falha) => falha.email));
  const analiseIaContratoSocial = paraAnaliseIaResumo(analiseContratoSocialRaw);
  const analiseIaPorSocioId = new Map(
    representantesLegais.map((socio, index) => [
      socio.id,
      paraAnaliseIaResumo(analisesSociosRaw[index] ?? null),
    ]),
  );

  const documentosParaRevisao = [
    ...paraDocumentoRevisao(
      contratoSocial,
      "Contrato Social",
      contratoSocial
        ? historicoDoSlot(todosDocumentos, "CONTRATO_SOCIAL", null, contratoSocial.id)
        : [],
    ),
    ...representantesLegais.flatMap((socio) => [
      ...paraDocumentoRevisao(
        socio.rg,
        `RG/CNH — ${socio.nome}`,
        socio.rg ? historicoDoSlot(todosDocumentos, "RG_CNPJ", socio.id, socio.rg.id) : [],
      ),
      ...paraDocumentoRevisao(
        socio.procuracao,
        `Procuração — ${socio.nome}`,
        socio.procuracao
          ? historicoDoSlot(todosDocumentos, "PROCURACAO", socio.id, socio.procuracao.id)
          : [],
      ),
    ]),
  ];
  const { ativos: documentosAtivos, pendentes: documentosPendentes } =
    separarDocumentosPorStatus(documentosParaRevisao);

  const { indiceAtual: indiceTrilha, recusado } = calcularProgressoTrilha(
    agencia.status,
    contratoAtual !== null,
  );

  const filaAssinatura = montarFilaAssinatura(
    representantesLegais,
    signatariosPadraoAtivos,
    contratoAtual?.status ?? null,
    emailsNaoEntregues,
  );

  return {
    agencia,
    complementar,
    representantesLegais,
    contratoSocial,
    contratoAtual,
    emailsNaoEntregues,
    signatariosPadraoAtivos,
    filaAssinatura,
    documentosAtivos,
    documentosPendentes,
    indiceTrilha,
    trilhaRecusada: recusado,
    analiseIaContratoSocial,
    analiseIaPorSocioId,
    parecerIa,
    dadosReceita,
    usuarioMaster,
  };
}
