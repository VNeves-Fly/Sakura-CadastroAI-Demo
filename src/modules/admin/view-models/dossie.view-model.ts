import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { temAtualizacaoPendente } from "@/modules/cadastro/domain/entities/agencia.entity";
import {
  paraDocumentoRevisao,
  historicoDoSlot,
  separarDocumentosPorStatus,
  calcularProgressoTrilha,
  montarFilaAssinatura,
  paraAnaliseIaResumo,
  paraParecerView,
  paraAnaliseCreditoView,
  paraVerificacaoCadastralView,
  paraDocumentosOutros,
  paraEmpresaExtraidoView,
  paraConsultaSicaView,
} from "@/modules/admin/adapters/dossie.adapter";

// Orquestra tudo que a página do dossiê precisa numa chamada só: busca
// no controller (a única camada que fala com o backend) + normaliza via
// adapter — a page só destructura o resultado e renderiza, sem decidir
// nada sobre o formato do dado.
export async function obterDossieView(id: string) {
  const detalhe = await cadastroAdminController.obterDetalhe(id).catch(() => null);

  if (!detalhe) return null;

  const {
    agencia,
    complementar,
    representantesLegais,
    contratoSocial,
    contratos,
    analiseIa,
    historicoConsultaCredito,
    consultasSst,
    executivoNome,
    associacaoNome,
    eventoNome,
  } = detalhe;
  const contratoAtual = contratos[0] ?? null;
  const parecerIa = paraParecerView(analiseIa);
  const analiseCredito = paraAnaliseCreditoView(analiseIa, historicoConsultaCredito);
  const verificacaoCadastral = paraVerificacaoCadastralView(analiseIa);
  const consultaSica = paraConsultaSicaView(consultasSst);

  // Indicativo de "e-mail não entregue" (D4Sign webhook, type_post=2) —
  // por e-mail, cobre tanto os sócios quanto os signatários fixos da
  // Sakura, sem depender de terem uma linha em ContratoSignatario.
  // Análise de IA (contrato social + RG de cada sócio) já é gravada de
  // verdade pelo FinalizarCadastroUseCase — aqui só lê de volta pra
  // mostrar no dossiê, algo que nenhum use-case fazia até agora.
  const [
    emailsFalhaEntrega,
    assinaturasContrato,
    signatariosPadraoAtivos,
    analiseContratoSocialRaw,
    analisesSociosRaw,
    dadosReceita,
    usuarioMaster,
    todosDocumentos,
    historicosSociosRaw,
    historicoAgencia,
    historicoComplementar,
    decisoesHumanas,
    notificacoes,
    observacoes,
  ] = await Promise.all([
    contratoAtual
      ? cadastroAdminController.listarEmailsFalhaEntregaContrato(contratoAtual.id)
      : Promise.resolve([]),
    // Log real de quem assinou e quando (ContratoAssinatura, gravado
    // pelo webhook type_post=4 do D4Sign) — alimenta a Fila de
    // Assinatura com timestamp por linha.
    contratoAtual
      ? cadastroAdminController.listarAssinaturasContrato(contratoAtual.id)
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
    // Histórico de edição em lote (ver EditarRepresentanteLegalUseCase),
    // um por sócio.
    Promise.all(
      representantesLegais.map((socio) => cadastroAdminController.listarHistoricoEdicoes(socio.id)),
    ),
    cadastroAdminController.listarHistoricoEdicoes(agencia.id),
    complementar
      ? cadastroAdminController.listarHistoricoEdicoes(complementar.id)
      : Promise.resolve([]),
    // Quem aprovou manualmente um cadastro que a IA reprovou/falhou (ver
    // AprovarCadastroComplementarUseCase) — mais recente primeiro.
    cadastroAdminController.listarDecisoesHumanas(agencia.id),
    // Log de "cliente enviou algo novo" (mensagem/documento) — filtrado
    // abaixo pelas que ainda não foram vistas por quem estava atendendo.
    cadastroAdminController.listarNotificacoes(agencia.id),
    // Notas livres do analista sobre o cadastro (ver ObservacaoCadastro) —
    // mais recente primeiro, não afeta nenhum outro dado da agência.
    cadastroAdminController.listarObservacoes(agencia.id),
  ]);
  const emailsNaoEntregues = new Set(emailsFalhaEntrega.map((falha) => falha.email));
  // `keySigner` também vem daqui — precisa pro botão "Ver/copiar link" na
  // Fila de Assinatura (ver ObterLinkAssinaturaUseCase).
  const assinaturasPorEmail = new Map(
    assinaturasContrato.map((assinatura) => [
      assinatura.email,
      { assinadoEm: assinatura.assinadoEm, keySigner: assinatura.keySigner },
    ]),
  );
  const analiseIaContratoSocial = paraAnaliseIaResumo(analiseContratoSocialRaw);
  const empresaExtraido = paraEmpresaExtraidoView(analiseIaContratoSocial);
  const analiseIaPorSocioId = new Map(
    representantesLegais.map((socio, index) => [
      socio.id,
      paraAnaliseIaResumo(analisesSociosRaw[index] ?? null),
    ]),
  );
  const historicoEdicoesPorSocioId = new Map(
    representantesLegais.map((socio, index) => [socio.id, historicosSociosRaw[index] ?? []]),
  );
  // Empresa é editada em duas tabelas (Agencia + CadastroComplementar, ver
  // EditarDadosEmpresaUseCase) — junta as duas linhas do tempo numa lista
  // só pro form de edição da empresa mostrar um histórico único.
  const historicoEdicoesEmpresa = [...historicoAgencia, ...historicoComplementar].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
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
  const documentosOutros = paraDocumentosOutros(todosDocumentos, representantesLegais);
  // Mesmo conjunto (contrato social + RG/procuração de cada sócio) que
  // AprovarCadastroComplementarUseCase valida antes de aprovar — usado
  // aqui só pra desabilitar o botão e mostrar ao analista o que falta
  // revisar, sem esperar o erro do backend.
  const documentosNaoAprovados = documentosParaRevisao.filter((doc) => doc.status !== "APROVADO");

  const { indiceAtual: indiceTrilha, recusado } = calcularProgressoTrilha(
    agencia.status,
    contratoAtual !== null,
  );

  // decisoesHumanas já vem ordenado createdAt desc (ver
  // PrismaDecisaoHumanaRepository) — a primeira da etapa COMPLEMENTAR é
  // sempre a aprovação manual mais recente.
  const decisaoComplementar =
    decisoesHumanas.find((decisao) => decisao.etapa === "COMPLEMENTAR") ?? null;

  // O que aconteceu nesta ficha desde a última vez que quem estava em
  // atendimento a viu (ver marcarAtualizacaoComoVista, chamado pela page
  // DEPOIS de ler este view — senão a lista já chegaria vazia aqui).
  const notificacoesPendentes = notificacoes.filter((notificacao) =>
    temAtualizacaoPendente(agencia.atualizacaoVistaEm, notificacao.createdAt),
  );

  const filaAssinatura = montarFilaAssinatura(
    representantesLegais,
    signatariosPadraoAtivos,
    contratoAtual?.status ?? null,
    emailsNaoEntregues,
    assinaturasPorEmail,
  );

  return {
    agencia,
    executivoNome,
    associacaoNome,
    eventoNome,
    complementar,
    representantesLegais,
    contratoSocial,
    contratos,
    contratoAtual,
    emailsNaoEntregues,
    signatariosPadraoAtivos,
    filaAssinatura,
    documentosAtivos,
    documentosPendentes,
    documentosOutros,
    documentosNaoAprovados,
    indiceTrilha,
    trilhaRecusada: recusado,
    analiseIaContratoSocial,
    analiseIaPorSocioId,
    parecerIa,
    analiseCredito,
    verificacaoCadastral,
    consultaSica,
    empresaExtraido,
    dadosReceita,
    usuarioMaster,
    historicoEdicoesPorSocioId,
    historicoEdicoesEmpresa,
    decisaoComplementar,
    notificacoesPendentes,
    observacoes,
  };
}
