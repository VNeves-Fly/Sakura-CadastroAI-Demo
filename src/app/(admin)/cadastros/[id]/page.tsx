import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { atendimentoController } from "@/modules/atendimento/presentation/controllers/atendimento.controller";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { AtendimentoAgenciaAcoes } from "@/modules/atendimento/components/atendimento-agencia-acoes";
import {
  Building2,
  Users,
  Landmark,
  FileSignature,
  FileCheck2,
  CheckCircle2,
  Circle,
  KeyRound,
  ScrollText,
  FolderCheck,
  Bell,
  Sparkles,
  Eye,
  Clock,
  X,
} from "lucide-react";
import { SecaoColapsavel } from "@/modules/admin/components/secao-colapsavel";
import { VisualizarDocumento } from "@/modules/admin/components/visualizar-documento";
import {
  Campo,
  CamposGrid,
  CampoEndereco,
  SubsecaoLabel,
  SituacaoCadastralBadge,
  CnaesDetalhe,
  CampoDocumento,
  ParecerIa,
  VerificacaoCadastral,
  ComparacaoEmpresaCampo,
  ComparacaoEnderecoEmpresa,
  CampoEmailContato,
  HistoricoAtendimentoAgencia,
} from "@/modules/admin/components/dossie-campos";
import {
  formatarData,
  formatarDataCurta,
  formatarMoedaBrl,
  formatarEnderecoReceita,
  corFundoDocumento,
} from "@/modules/admin/utils/dossie-campos.util";
import { RevisaoDocumentosComplementar } from "@/modules/admin/components/revisao-documentos";
import {
  ConsultaAmatCard,
  ConsultaSofiaCard,
} from "@/modules/admin/components/consulta-amat-sofia";
import { ConsultaSicaCard } from "@/modules/admin/components/consulta-sica";
import { ValidacaoSicaTravelLink } from "./validacao-sica-travel-link";
import { BotaoSubmitComLoading } from "./botao-submit-loading";
import { EditarSocioForm } from "./editar-socio-form";
import { NovoSocioForm } from "./novo-socio-form";
import { RemoverSocioForm } from "./remover-socio-form";
import { ForcarAvancoModal } from "./forcar-avanco-modal";
import { CancelarContratoModal } from "./cancelar-contrato-modal";
import { RecusarCadastroModal } from "./recusar-cadastro-modal";
import { EditarEmpresaForm } from "./editar-empresa-form";
import { EditarDadosBancariosForm } from "./editar-dados-bancarios-form";
import { FilaAssinatura } from "./fila-assinatura";
import { SincronizarContratoD4SignButton } from "./sincronizar-contrato-d4sign-button";
import { ContratoIdManual } from "./contrato-id-manual";
import { UsuarioMaster } from "./usuario-master";
import { CnpjCopiavel } from "./cnpj-copiavel";
import { AprovarComplementarModal } from "./aprovar-complementar-modal";
import { VoltarButton } from "./voltar-button";
import { AtendimentoButton } from "./atendimento-button";
import { CadastroDetalheLive } from "./cadastro-detalhe-live";
import { obterDossieView } from "@/modules/admin/view-models/dossie.view-model";
import {
  labelOrigemContrato,
  labelEstadoCivil,
  labelTipoConta,
  labelBancoPais,
  formatarEndereco,
  labelStatusContrato,
  ETAPAS_PIPELINE,
  paraUsuarioMasterView,
  usuarioMasterEstaCompleto,
  documentosAguardandoRevisaoPosReenvio,
} from "@/modules/admin/adapters/dossie.adapter";
import { labelStatus, classesBadgeStatus } from "@/modules/admin/utils/status-cadastro.util";
import {
  STATUS_EM_ANALISE,
  STATUS_ATIVO,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_AGUARDANDO_CADASTRAMENTO,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_COMPLEMENTAR,
  STATUS_RECUSADO,
  CONTRATO_STATUS_ASSINADO,
  CONTRATO_STATUS_ASSINADO_AGENCIA,
  CONTRATO_STATUS_CANCELADO,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import {
  aprovarComplementarAction,
  aprovarDocumentoAction,
  reprovarDocumentoAction,
  inserirDocumentoManualAction,
  editarSocioAction,
  adicionarSocioAction,
  removerSocioAction,
  editarEmpresaAction,
  editarDadosBancariosAction,
  solicitarReenvioDocumentosAction,
  marcarInfoPendenteAction,
  desmarcarInfoPendenteAction,
  ativarClienteAction,
  marcarContratoAssinadoAction,
  recusarCadastroAction,
  reprocessarAnaliseAction,
  reconsultarCreditoAction,
  consultarSicaAction,
  atualizarSicaAction,
  confirmarCadastramentoAction,
  forcarAvancoStatusAction,
  cancelarContratoAction,
  salvarSicaAction,
  salvarTravelLinkAction,
  salvarUsuarioMasterAction,
} from "./actions";

// `concluida` default true — Contrato/SICA continuam decorativos (chegar
// na etapa Ativação já implica que passaram), só TravelLink passou a
// checar de verdade (agencia.travelLinkCriado, ver TravelLinkSwitch).
function ChecklistEtapaConcluida({
  label,
  concluida = true,
}: {
  label: string;
  concluida?: boolean;
}) {
  if (!concluida) {
    return (
      <span className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium">
        <Circle className="size-4" />
        {label}
      </span>
    );
  }

  return (
    <span className="text-success flex items-center gap-1.5 text-sm font-semibold">
      <CheckCircle2 className="size-4" />
      {label}
    </span>
  );
}

// O fluxo é sequencial (o analista não pula pra frente, cada etapa libera
// a próxima por uma ação real) — mas etapas já concluídas ficam navegáveis
// em modo leitura (ver `etapaExibida` na page): o analista clica no
// círculo/rótulo de uma etapa passada e revê o que já foi feito, sem
// poder agir nela. Etapas futuras (ainda não alcançadas) continuam sem
// link. Se o cadastro foi recusado, a trilha toda vira só informativa —
// não faz sentido "revisar" um fluxo interrompido fora da ordem normal.
function TrilhaProgresso({
  agenciaId,
  indiceAtual,
  etapaExibida,
  recusado,
}: {
  agenciaId: string;
  indiceAtual: number;
  etapaExibida: number;
  recusado: boolean;
}) {
  return (
    <div className="flex items-start">
      {ETAPAS_PIPELINE.map((etapa, index) => {
        const concluida = index < indiceAtual;
        const atual = index === indiceAtual;
        const selecionada = index === etapaExibida;
        const navegavel = !recusado && index <= indiceAtual;
        const ehUltima = index === ETAPAS_PIPELINE.length - 1;

        const conteudoEtapa = (
          <div className="flex shrink-0 flex-col items-center">
            {/* Círculo e rótulo ficam juntos numa coluna de largura fixa
                (pelo conteúdo) — antes a linha conectora dividia espaço
                com o círculo na mesma linha, empurrando ele pra esquerda
                do rótulo (que fica centralizado na coluna toda). Assim o
                círculo sempre fica centralizado em cima do próprio número.
                O `flex-1` fica no wrapper (não só na linha) pra ela
                conseguir esticar de verdade dentro do espaço disponível. */}
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                atual && recusado
                  ? "bg-destructive text-destructive-foreground"
                  : concluida || atual
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              } ${selecionada && !atual ? "ring-primary/40 ring-2 ring-offset-2" : ""} ${
                navegavel ? "hover:opacity-80" : ""
              }`}
            >
              {concluida ? "✓" : index + 1}
            </span>
            <span
              className={`mt-1 text-center text-[10px] font-medium whitespace-nowrap uppercase ${
                selecionada ? "text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              {atual && recusado ? "Recusado" : etapa.label}
            </span>
          </div>
        );

        return (
          <div key={etapa.status} className={`flex items-start ${ehUltima ? "" : "flex-1"}`}>
            {navegavel ? (
              <Link
                href={atual ? `/cadastros/${agenciaId}` : `/cadastros/${agenciaId}?etapa=${index}`}
                title={atual ? "Etapa atual" : `Ver "${etapa.label}" em modo leitura`}
              >
                {conteudoEtapa}
              </Link>
            ) : (
              conteudoEtapa
            )}
            {!ehUltima ? (
              <div className="flex h-6 flex-1 items-center">
                <div className={`h-0.5 w-full ${concluida ? "bg-primary" : "bg-muted"}`} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default async function DossieAgenciaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { etapa?: string; leitura?: string };
}) {
  const view = await obterDossieView(params.id);

  if (!view) {
    notFound();
  }

  const session = await getServerSession(nextAuthOptions);
  const analistaId = session?.user?.id ?? null;
  const cargo = session?.user?.cargo;

  // Gestor/Executivo (2026-08-03) só acompanham (leitura) o que é deles —
  // mesmo escopo resolvido em /cadastros (page.tsx da listagem). 404 (em
  // vez de só esconder ações) se a agência não pertence ao escopo, senão
  // dava pra acessar qualquer dossiê direto pela URL.
  if (cargo === "EXECUTIVO") {
    const promotorDoUsuario = analistaId
      ? await atribuicoesAdminController.buscarPromotorPorUserId(analistaId)
      : null;
    if (!promotorDoUsuario || view.agencia.executivoId !== promotorDoUsuario.id) {
      notFound();
    }
  }
  if (cargo === "GESTOR") {
    const gestorDoUsuario = analistaId
      ? await atribuicoesAdminController.buscarGestorPorUserId(analistaId)
      : null;
    const executivoDaAgencia = view.agencia.executivoId
      ? await atribuicoesAdminController.buscarPromotorPorId(view.agencia.executivoId)
      : null;
    if (!gestorDoUsuario || executivoDaAgencia?.gestorId !== gestorDoUsuario.id) {
      notFound();
    }
  }
  const somenteLeituraPorCargo = cargo === "GESTOR" || cargo === "EXECUTIVO";

  const [atendimentoAtual, historicoAtendimento] = await Promise.all([
    atendimentoController.obterAtendimentoAgenciaAtual(view.agencia.id),
    atendimentoController.listarHistoricoAtendimentoAgencia(view.agencia.id),
  ]);
  const atendimentoAssumidoPorMim = atendimentoAtual?.analistaId === analistaId;
  const atendidoPorOutro = !!atendimentoAtual && !atendimentoAssumidoPorMim;

  // Só quem está atendendo "resolve" a atualização pendente ao abrir a
  // ficha (decisão do usuário) — abrir só pra olhar, sem ter assumido, não
  // conta como "visto". `view` já leu notificacoesPendentes ANTES desta
  // chamada, então o banner abaixo ainda mostra o que mudou desta vez.
  //
  // CRÍTICO: só grava quando há algo pendente de verdade. Gravar sempre
  // (mesmo sem nada pendente) causava um loop de refresh em produção —
  // o UPDATE em Agencia dispara o evento realtime, que o
  // CadastroDetalheLive (montado nesta mesma página) escuta e responde
  // com router.refresh(), que renderiza a página de novo, que gravava de
  // novo, infinitamente (e cada UPDATE também aparecia como "Um cadastro
  // foi atualizado." pra todo mundo em /cadastros via CadastrosLive).
  // Com o guard, depois da primeira marcação notificacoesPendentes fica
  // vazio e o refresh seguinte não escreve mais nada — o ciclo se fecha.
  if (atendimentoAssumidoPorMim && analistaId && view.notificacoesPendentes.length > 0) {
    await cadastroAdminController
      .marcarAtualizacaoComoVista(view.agencia.id, analistaId)
      .catch(() => {});
  }

  const {
    agencia,
    executivoNome,
    associacaoNome,
    eventoNome,
    complementar,
    representantesLegais,
    contratoSocial,
    contratoAtual,
    filaAssinatura,
    documentosAtivos,
    documentosPendentes,
    documentosNaoAprovados,
    indiceTrilha,
    trilhaRecusada,
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
  } = view;

  // Item mais recente do histórico de edições da própria Agencia cujo
  // alteracoes.status.para seja "recusado" (ver RecusarCadastroUseCase) —
  // undefined em cadastros recusados antes desta funcionalidade existir
  // (a recusa aconteceu, mas sem motivo registrado).
  const registroRecusa = historicoEdicoesEmpresa.find(
    (item) => item.entidade === "Agencia" && item.alteracoes.status?.para === STATUS_RECUSADO,
  );

  const usuarioMasterView = paraUsuarioMasterView(usuarioMaster);
  const reenviosAguardandoRevisao = documentosAguardandoRevisaoPosReenvio(documentosAtivos);
  // Mesmo conjunto do banner acima, só que como lookup por id — usado pra
  // repassar `reenviado` pro CampoDocumento de cada slot (Empresa/Sócios),
  // que mostra o badge inline em vez de só no aviso global.
  const idsDocumentosReenviados = new Set(reenviosAguardandoRevisao.map((doc) => doc.id));

  // Etapas concluídas ficam navegáveis em modo leitura (?etapa=N na URL) —
  // etapas futuras (index > indiceTrilha) são ignoradas e caem no fallback
  // pra etapa atual, mesma coisa se o cadastro foi recusado (a trilha não
  // é navegável nesse caso, ver TrilhaProgresso).
  const etapaParam = Number(searchParams?.etapa);
  const etapaValida = Number.isInteger(etapaParam) && etapaParam >= 0 && etapaParam <= indiceTrilha;
  const etapaExibida = !trilhaRecusada && etapaValida ? etapaParam : indiceTrilha;
  // ?leitura=1 força modo leitura mesmo na etapa atual — usado quando um
  // executivo abre o dossiê pela própria ficha (Atribuições), que nunca
  // pode agir no cadastro, só consultar. Gestor/Executivo (cargo) força o
  // mesmo modo server-side, sem depender do query param.
  const somenteLeituraExterna = searchParams?.leitura === "1" || somenteLeituraPorCargo;
  const mostrandoEtapaAtual = etapaExibida === indiceTrilha && !somenteLeituraExterna;
  // Trava real de UI (o backend já garante isso de novo em cada Server
  // Action, ver garantirAtendimentoAssumido em actions.ts) — só libera
  // ação quando, além de estar na etapa atual, o analista logado assumiu
  // o atendimento desta agência (decisão do usuário, 2026-07-28).
  const podeAgir = mostrandoEtapaAtual && atendimentoAssumidoPorMim;

  const indiceComplementar = ETAPAS_PIPELINE.findIndex(
    (etapa) => etapa.status === STATUS_EM_COMPLEMENTAR,
  );
  const indiceAssinatura = ETAPAS_PIPELINE.findIndex(
    (etapa) => etapa.status === STATUS_AGUARDANDO_ASSINATURA,
  );
  const indiceValidacao = ETAPAS_PIPELINE.findIndex(
    (etapa) => etapa.status === STATUS_AGUARDANDO_VALIDACAO,
  );
  const indiceCadastramento = ETAPAS_PIPELINE.findIndex(
    (etapa) => etapa.status === STATUS_AGUARDANDO_CADASTRAMENTO,
  );
  const indiceAtivacao = ETAPAS_PIPELINE.findIndex(
    (etapa) => etapa.status === STATUS_AGUARDANDO_ATIVACAO,
  );
  const indiceAtivo = ETAPAS_PIPELINE.findIndex((etapa) => etapa.status === STATUS_ATIVO);

  // Dados pro formulário de leitura do TravelLink (ver DadosEmpresaSecao)
  // — cópia dos mesmos dados já coletados na ficha, sem campo novo.
  // "Nome de contato"/"E-mail" usam o sócio representante legal (nenhuma
  // tela grava `cargo` hoje, então não tem "cargo" pra copiar junto).
  const socioContatoTravelLink =
    representantesLegais.find((socio) => socio.isRepresentanteLegal) ??
    representantesLegais[0] ??
    null;
  const enderecoAgenciaTravelLink = complementar
    ? formatarEndereco(complementar.enderecoAgencia)
    : "—";
  const bancoLabelTravelLink = complementar?.bancoNome
    ? `${complementar.bancoCodigo ? `${complementar.bancoCodigo} - ` : ""}${complementar.bancoNome}`
    : null;

  return (
    <div className="flex flex-col gap-4">
      <CadastroDetalheLive agenciaId={params.id} />
      {notificacoesPendentes.length > 0 ? (
        <div className="border-warning bg-warning/10 text-warning-text flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold">
          <Bell className="size-4 shrink-0" />
          {notificacoesPendentes.length} atualização
          {notificacoesPendentes.length > 1 ? "ões" : ""} desde a última visita:{" "}
          {notificacoesPendentes.map((notificacao) => notificacao.titulo).join(", ")}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <VoltarButton />
        <div className="flex flex-wrap items-center gap-2">
          {agencia.infoPendente ? (
            <span className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full py-1 pr-1 pl-2.5 text-xs font-bold">
              <Clock className="size-3.5" />
              Info pendente
              {somenteLeituraPorCargo ? null : (
                <form action={desmarcarInfoPendenteAction.bind(null, agencia.id)}>
                  <button
                    type="submit"
                    title="Remover — já resolvido por fora do sistema"
                    className="hover:bg-accent hover:text-foreground rounded-full p-0.5 transition"
                  >
                    <X className="size-3" />
                  </button>
                </form>
              )}
            </span>
          ) : somenteLeituraPorCargo ? null : (
            <form action={marcarInfoPendenteAction.bind(null, agencia.id)}>
              <button
                type="submit"
                title="Marcar que está esperando algo da agência (fora do fluxo de reenvio de documento)"
                className="border-input text-muted-foreground hover:bg-accent hover:text-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition"
              >
                <Clock className="size-3.5" />
                Marcar info pendente
              </button>
            </form>
          )}
          <span className="text-muted-foreground text-xs">
            {atendimentoAtual ? (
              <>
                {atendimentoAssumidoPorMim
                  ? "Você está atendendo"
                  : `${atendimentoAtual.analistaNome} está atendendo`}{" "}
                desde {formatarData(atendimentoAtual.assumidoEm)}
              </>
            ) : (
              "Ninguém atendendo este cadastro"
            )}
          </span>
          {/* Gestor/Executivo nunca podem assumir atendimento (decisão do
              usuário, 2026-08-03) — nem o botão de ação nem o link pro
              painel de atendimento aparecem pra esses cargos. */}
          {somenteLeituraPorCargo ? null : (
            <AtendimentoAgenciaAcoes
              agenciaId={agencia.id}
              analistaId={analistaId ?? ""}
              atendimentoAtual={atendimentoAtual}
            />
          )}
          <HistoricoAtendimentoAgencia historico={historicoAtendimento} />
          {somenteLeituraPorCargo ? null : <AtendimentoButton agenciaId={agencia.id} />}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-[#f6c3ca]/75 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-wide text-[#00043e]">{agencia.razaoSocial}</h1>
          {/* Gestor/Base escondidos até existir fonte de dado real (aguardando
              modelagem no backend) — mostrar "—" com tooltip parecia
              funcionalidade quebrada, não um espaço reservado pro futuro.
              Evento/Executivo/Associação vêm resolvidos de verdade agora
              (Agencia.eventoId/executivoId/associacaoId). */}
          {eventoNome || executivoNome || associacaoNome ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {eventoNome ? (
                <span className="bg-accent text-accent-foreground border-primary rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap">
                  {eventoNome}
                </span>
              ) : null}
              {executivoNome ? (
                <span className="bg-primary/10 text-primary border-primary rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap">
                  {executivoNome}
                </span>
              ) : null}
              {associacaoNome ? (
                <span className="bg-primary/10 text-primary border-primary rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap">
                  {associacaoNome}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-0.5 text-sm">
            <span>
              <span className="text-black">E-mail:</span>{" "}
              <span className="text-foreground font-medium">{agencia.emailContato || "—"}</span>
            </span>
            <span>
              <span className="text-black">Telefone:</span>{" "}
              <span className="text-foreground font-medium">
                {complementar?.telefoneComercial || "—"}
              </span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm">
            <span className="font-medium text-black">CNPJ:</span>
            <CnpjCopiavel cnpj={agencia.cnpj} />
          </p>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${classesBadgeStatus(agencia.status)}`}
          >
            {labelStatus(agencia.status)}
          </span>
        </div>
      </div>

      <div className="border-border bg-card rounded-2xl border p-5">
        <TrilhaProgresso
          agenciaId={agencia.id}
          indiceAtual={indiceTrilha}
          etapaExibida={etapaExibida}
          recusado={trilhaRecusada}
        />
      </div>

      {agencia.status === STATUS_EM_ANALISE ? (
        <div className="border-border bg-muted/40 text-muted-foreground flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed px-4 py-3 text-sm">
          <span>
            Cadastro persistido, aguardando a análise de IA rodar em background (documentos +
            avaliação final). Se estiver parado aqui por muito tempo, a análise pode ter falhado
            tecnicamente — use o botão ao lado pra rodar de novo.
          </span>
          <form action={reprocessarAnaliseAction.bind(null, agencia.id)}>
            <BotaoSubmitComLoading
              labelCarregando="Reprocessando..."
              disabled={!atendimentoAssumidoPorMim}
              title={
                atendimentoAssumidoPorMim
                  ? undefined
                  : "Assuma o atendimento deste cadastro pra poder reprocessar"
              }
              className="bg-primary text-primary-foreground hover:bg-sakura-600 disabled:hover:bg-primary flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reprocessar análise
            </BotaoSubmitComLoading>
          </form>
        </div>
      ) : null}

      {somenteLeituraExterna ? (
        <div className="border-primary/30 bg-primary/5 text-primary rounded-2xl border border-dashed px-4 py-3 text-sm">
          Visualização somente leitura — nenhuma ação pode ser feita aqui.
        </div>
      ) : !mostrandoEtapaAtual ? (
        <div className="border-primary/30 bg-primary/5 text-primary flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed px-4 py-3 text-sm">
          <span>
            Modo leitura — revendo a etapa <strong>{ETAPAS_PIPELINE[etapaExibida]?.label}</strong>,
            já concluída. Nenhuma ação pode ser feita aqui.
          </span>
          <Link
            href={`/cadastros/${agencia.id}`}
            className="bg-primary text-primary-foreground hover:bg-sakura-600 shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition"
          >
            Voltar pra etapa atual
          </Link>
        </div>
      ) : !atendimentoAssumidoPorMim ? (
        <div className="border-primary/30 bg-primary/5 text-primary flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed px-4 py-3 text-sm">
          <span>
            {atendidoPorOutro
              ? `${atendimentoAtual?.analistaNome} está atendendo este cadastro agora — assuma o atendimento pra poder agir.`
              : "Assuma o atendimento pra poder agir neste cadastro. Visualização de documentos continua liberada."}
          </span>
          <AtendimentoAgenciaAcoes
            agenciaId={agencia.id}
            analistaId={analistaId ?? ""}
            atendimentoAtual={atendimentoAtual}
          />
        </div>
      ) : null}

      {/* Complementar concentra TODOS os dados que o cliente preencheu
          (/cadastro + /chat) + revisão de documento — só existe nesta
          etapa (decisão do usuário, 2026-07-27): pra ver depois que o
          cadastro avançou, o analista clica em "Complementar" na trilha
          (modo leitura, ?etapa=), o que também já garante sozinho que
          aprovar/reprovar documento só acontece aqui (somenteLeitura vem
          de mostrandoEtapaAtual, que fica false ao revisitar em leitura). */}
      {etapaExibida === indiceComplementar ? (
        <>
          {!complementar ? (
            <div className="border-border bg-card text-muted-foreground rounded-2xl border p-6 text-sm">
              Dados complementares não encontrados pra esta agência.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ConsultaAmatCard
                  amat={analiseCredito.amat}
                  rawAmat={analiseCredito.rawAmat}
                  historico={analiseCredito.historicoAmat}
                  reconsultar={
                    podeAgir ? reconsultarCreditoAction.bind(null, agencia.id, "AMAT") : undefined
                  }
                />
                <ConsultaSofiaCard
                  sofia={analiseCredito.sofia}
                  rawSofia={analiseCredito.rawSofia}
                  historico={analiseCredito.historicoSofia}
                  reconsultar={
                    podeAgir ? reconsultarCreditoAction.bind(null, agencia.id, "SOFIA") : undefined
                  }
                />
                <ConsultaSicaCard
                  consulta={consultaSica}
                  reconsultar={podeAgir ? consultarSicaAction.bind(null, agencia.id) : undefined}
                />
              </div>

              <SecaoColapsavel titulo="Empresa" icon={<Building2 className="size-4" />}>
                <div className="mb-3 flex justify-end">
                  <EditarEmpresaForm
                    agenciaId={agencia.id}
                    agencia={agencia}
                    complementar={complementar}
                    dadosReceita={dadosReceita}
                    historico={historicoEdicoesEmpresa}
                    editarEmpresaAction={editarEmpresaAction}
                    disabled={!podeAgir}
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <SubsecaoLabel>Identificação</SubsecaoLabel>
                    <CamposGrid>
                      <ComparacaoEmpresaCampo
                        label="Razão Social"
                        cadastro={agencia.razaoSocial}
                        extraido={empresaExtraido.razaoSocial}
                        oficial={verificacaoCadastral?.razaoSocial?.oficial ?? null}
                        confere={verificacaoCadastral?.razaoSocial?.confere}
                      />
                      <ComparacaoEmpresaCampo
                        label="Nome Fantasia"
                        cadastro={agencia.nomeFantasia}
                        extraido={empresaExtraido.nomeFantasia}
                        oficial={verificacaoCadastral?.nomeFantasia?.oficial ?? null}
                      />
                    </CamposGrid>
                  </div>

                  <div className="flex flex-col gap-2">
                    <SubsecaoLabel>Endereço</SubsecaoLabel>
                    <CamposGrid>
                      <ComparacaoEnderecoEmpresa
                        cadastro={complementar.enderecoAgencia}
                        extraido={empresaExtraido.endereco}
                        oficial={dadosReceita?.endereco ?? null}
                      />
                    </CamposGrid>
                  </div>

                  <div className="flex flex-col gap-2">
                    <SubsecaoLabel>Contato</SubsecaoLabel>
                    <CamposGrid>
                      <CampoEmailContato
                        email={agencia.emailContato}
                        emailInfo={verificacaoCadastral?.email ?? null}
                      />
                      <Campo label="Telefone Comercial">
                        {complementar.telefoneComercial || "—"}
                      </Campo>
                      <Campo label="E-mail Operacional">
                        {complementar.emailOperacional || "—"}
                      </Campo>
                      <Campo label="E-mail Comercial">{complementar.emailComercial || "—"}</Campo>
                      <Campo label="E-mail Financeiro">{complementar.emailFinanceiro || "—"}</Campo>
                    </CamposGrid>
                  </div>

                  <div className="flex flex-col gap-2">
                    <SubsecaoLabel>Documento</SubsecaoLabel>
                    <CamposGrid>
                      <Campo
                        label="Contrato Social"
                        corFundo={corFundoDocumento(contratoSocial)}
                        className="sm:col-span-2"
                      >
                        <CampoDocumento
                          documento={contratoSocial}
                          analise={analiseIaContratoSocial}
                          agenciaId={agencia.id}
                          tipo="CONTRATO_SOCIAL"
                          representanteLegalId={null}
                          aprovarDocumentoAction={aprovarDocumentoAction}
                          reprovarDocumentoAction={reprovarDocumentoAction}
                          inserirDocumentoManualAction={inserirDocumentoManualAction}
                          somenteLeitura={!podeAgir}
                          reenviado={
                            contratoSocial ? idsDocumentosReenviados.has(contratoSocial.id) : false
                          }
                        />
                      </Campo>
                    </CamposGrid>
                  </div>
                </div>
              </SecaoColapsavel>

              <SecaoColapsavel titulo="Dados da Receita" icon={<ScrollText className="size-4" />}>
                <div className="mb-4 flex flex-col gap-2">
                  <SubsecaoLabel>Verificação Cadastral (Fornecido x Receita)</SubsecaoLabel>
                  <VerificacaoCadastral stage1={verificacaoCadastral} />
                </div>

                {!dadosReceita ? (
                  <p className="text-muted-foreground text-sm">
                    Dados da Receita não disponíveis — cadastro anterior a esta funcionalidade (só
                    cadastros novos passam a gravar esse dado).
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    <CamposGrid>
                      <Campo label="Situação Cadastral">
                        <SituacaoCadastralBadge situacao={dadosReceita.situacaoCadastral} />
                      </Campo>
                      <Campo label="Natureza Jurídica">
                        {dadosReceita.naturezaJuridica || "—"}
                      </Campo>
                      <Campo label="Porte">{dadosReceita.porte || "—"}</Campo>
                      <Campo label="Capital Social">
                        {formatarMoedaBrl(dadosReceita.capitalSocial)}
                      </Campo>
                      <Campo label="Data de Abertura">
                        {dadosReceita.dataAbertura
                          ? formatarDataCurta(dadosReceita.dataAbertura)
                          : "—"}
                      </Campo>
                      <Campo label="Optante pelo Simples">
                        {dadosReceita.optanteSimples
                          ? `Sim${dadosReceita.dataOpcaoSimples ? ` (desde ${formatarDataCurta(dadosReceita.dataOpcaoSimples)})` : ""}`
                          : "Não"}
                      </Campo>
                    </CamposGrid>

                    <div className="flex flex-col gap-2">
                      <SubsecaoLabel>Contato</SubsecaoLabel>
                      <CamposGrid>
                        <Campo label="Telefone (Receita)">{dadosReceita.telefone || "—"}</Campo>
                        <Campo label="E-mail (Receita)">{dadosReceita.email || "—"}</Campo>
                      </CamposGrid>
                    </div>

                    <div className="flex flex-col gap-2">
                      <SubsecaoLabel>Endereço</SubsecaoLabel>
                      <p className="text-foreground text-sm font-medium">
                        {formatarEnderecoReceita(dadosReceita.endereco)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <SubsecaoLabel>Atividades (CNAE)</SubsecaoLabel>
                      <CnaesDetalhe cnaes={dadosReceita.cnaes} />
                    </div>

                    <p className="border-border text-muted-foreground border-t pt-3 text-xs">
                      Consultado em {formatarData(dadosReceita.consultadoEm)}
                    </p>
                  </div>
                )}
              </SecaoColapsavel>

              <SecaoColapsavel titulo="Parecer da IA" icon={<Sparkles className="size-4" />}>
                <ParecerIa parecer={parecerIa} />
              </SecaoColapsavel>

              <SecaoColapsavel titulo="Sócios" icon={<Users className="size-4" />}>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-end">
                    <NovoSocioForm
                      agenciaId={agencia.id}
                      adicionarSocioAction={adicionarSocioAction}
                      disabled={!podeAgir}
                    />
                  </div>
                  {representantesLegais.map((socio) => (
                    <div
                      key={socio.id}
                      className="border-border bg-muted/40 flex flex-col gap-2 rounded-xl border px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-foreground font-semibold">{socio.nome}</span>
                        <div className="flex items-center gap-2">
                          {socio.isRepresentanteLegal ? (
                            <span className="bg-primary/15 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                              Representante legal
                            </span>
                          ) : null}
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              socio.administrativo === false
                                ? "bg-muted text-muted-foreground"
                                : "bg-success/15 text-success"
                            }`}
                          >
                            {socio.administrativo === false
                              ? "Não assina o contrato"
                              : "Assina o contrato"}
                          </span>
                          <EditarSocioForm
                            agenciaId={agencia.id}
                            socio={socio}
                            historico={historicoEdicoesPorSocioId.get(socio.id) ?? []}
                            editarSocioAction={editarSocioAction}
                            disabled={!podeAgir}
                          />
                          <RemoverSocioForm
                            agenciaId={agencia.id}
                            representanteLegalId={socio.id}
                            nomeSocio={socio.nome}
                            removerSocioAction={removerSocioAction}
                            disabled={!podeAgir}
                          />
                        </div>
                      </div>
                      <CamposGrid>
                        <Campo label="CPF">{socio.cpf}</Campo>
                        <Campo label="E-mail">{socio.email}</Campo>
                        <Campo label="Telefone">{socio.telefone}</Campo>
                        <Campo label="Estado Civil">{labelEstadoCivil(socio.estadoCivil)}</Campo>
                        <Campo label="Nacionalidade">{socio.nacionalidade || "—"}</Campo>
                        <CampoEndereco label="Endereço" endereco={socio.endereco} />
                        <Campo label="RG/CNH" corFundo={corFundoDocumento(socio.rg)}>
                          <CampoDocumento
                            documento={socio.rg}
                            analise={analiseIaPorSocioId.get(socio.id) ?? null}
                            agenciaId={agencia.id}
                            tipo="RG_CNPJ"
                            representanteLegalId={socio.id}
                            aprovarDocumentoAction={aprovarDocumentoAction}
                            reprovarDocumentoAction={reprovarDocumentoAction}
                            inserirDocumentoManualAction={inserirDocumentoManualAction}
                            somenteLeitura={!podeAgir}
                            reenviado={socio.rg ? idsDocumentosReenviados.has(socio.rg.id) : false}
                          />
                        </Campo>
                        {socio.rgNumero ? (
                          <Campo label="Número do RG">
                            {socio.rgNumero}
                            {socio.rgOrgaoEmissor ? ` / ${socio.rgOrgaoEmissor}` : ""}
                          </Campo>
                        ) : null}
                        {socio.procuracao || socio.isRepresentanteLegal ? (
                          <Campo label="Procuração" corFundo={corFundoDocumento(socio.procuracao)}>
                            <CampoDocumento
                              documento={socio.procuracao}
                              agenciaId={agencia.id}
                              tipo="PROCURACAO"
                              representanteLegalId={socio.id}
                              aprovarDocumentoAction={aprovarDocumentoAction}
                              reprovarDocumentoAction={reprovarDocumentoAction}
                              inserirDocumentoManualAction={inserirDocumentoManualAction}
                              somenteLeitura={!podeAgir}
                              reenviado={
                                socio.procuracao
                                  ? idsDocumentosReenviados.has(socio.procuracao.id)
                                  : false
                              }
                            />
                          </Campo>
                        ) : null}
                      </CamposGrid>
                    </div>
                  ))}
                </div>
              </SecaoColapsavel>

              <SecaoColapsavel titulo="Banco" icon={<Landmark className="size-4" />}>
                <div className="mb-3 flex justify-end">
                  <EditarDadosBancariosForm
                    agenciaId={agencia.id}
                    complementar={complementar}
                    historico={historicoEdicoesEmpresa}
                    editarDadosBancariosAction={editarDadosBancariosAction}
                    disabled={!podeAgir}
                  />
                </div>
                <CamposGrid>
                  <Campo label="Banco">
                    {complementar.bancoCodigo ? `${complementar.bancoCodigo} - ` : ""}
                    {complementar.bancoNome} ({labelBancoPais(complementar.bancoPais ?? "")})
                  </Campo>
                  <Campo label="Tipo de Conta">
                    {labelTipoConta(complementar.tipoConta ?? "")}
                  </Campo>
                  <Campo label="Agência">{complementar.bancoAgencia}</Campo>
                  <Campo label="Conta">{complementar.bancoConta}</Campo>
                  <Campo label="Favorecido" className="sm:col-span-2">
                    {complementar.favorecidoNome} — {complementar.favorecidoDoc}
                  </Campo>
                </CamposGrid>
              </SecaoColapsavel>
            </>
          )}

          {/* Reenvio só existe na etapa Complementar (decisão do usuário,
              2026-07-27) — aprovar/reprovar documento também só acontece
              aqui, então não sobra motivo pra reenvio ficar solto em
              outra etapa. */}
          <SecaoColapsavel titulo="Reenvio de documentos" icon={<FolderCheck className="size-4" />}>
            <div className="flex flex-col gap-3">
              {reenviosAguardandoRevisao.length > 0 ? (
                <div className="border-warning bg-warning/10 text-warning-text flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold">
                  <Bell className="size-4 shrink-0" />
                  {reenviosAguardandoRevisao.length} documento
                  {reenviosAguardandoRevisao.length > 1 ? "s" : ""} reenviado
                  {reenviosAguardandoRevisao.length > 1 ? "s" : ""} pelo cliente, aguardando sua
                  revisão.
                </div>
              ) : null}

              <RevisaoDocumentosComplementar
                agenciaId={agencia.id}
                documentosPendentes={documentosPendentes}
                solicitarReenvioDocumentosAction={solicitarReenvioDocumentosAction}
                somenteLeitura={!podeAgir}
              />
            </div>
          </SecaoColapsavel>
        </>
      ) : null}

      <SecaoColapsavel titulo="Contrato" icon={<FileSignature className="size-4" />} defaultAberta>
        <div className="flex flex-col gap-3">
          {contratoAtual && etapaExibida === indiceAssinatura ? (
            <>
              <FilaAssinatura fila={filaAssinatura} agenciaId={agencia.id} />
              {podeAgir ? <SincronizarContratoD4SignButton agenciaId={agencia.id} /> : null}

              <div className="border-border bg-card border-l-primary/60 rounded-2xl border border-l-4 p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-primary flex items-center gap-2">
                    <FileCheck2 className="size-4" />
                    <span className="text-xs font-bold tracking-wide uppercase">
                      Contratos D4Sign
                    </span>
                  </span>
                  <VisualizarDocumento
                    url={`/api/cadastros/contratos/${contratoAtual.id}/arquivo`}
                    label="Contrato D4Sign"
                  >
                    <span className="border-input text-foreground hover:bg-accent flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition">
                      <Eye className="size-3.5" />
                      Visualizar Documento
                    </span>
                  </VisualizarDocumento>
                </div>

                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Campo label="Status">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                        contratoAtual.status === CONTRATO_STATUS_ASSINADO
                          ? "bg-success/15 text-success"
                          : contratoAtual.status === CONTRATO_STATUS_ASSINADO_AGENCIA
                            ? "bg-warning/15 text-warning"
                            : "bg-info/15 text-info"
                      }`}
                    >
                      {labelStatusContrato(contratoAtual.status)}
                    </span>
                  </Campo>
                  <Campo label="Origem">{labelOrigemContrato(contratoAtual.origemGeracao)}</Campo>
                  <Campo label="ID do Contrato" className="sm:col-span-2">
                    <ContratoIdManual
                      agenciaId={agencia.id}
                      contratoId={contratoAtual.id}
                      provedorId={contratoAtual.provedorId}
                      origemExterno={contratoAtual.origemGeracao === "externo"}
                      somenteLeitura={!podeAgir}
                    />
                  </Campo>
                  <Campo label="Criado em">{formatarData(contratoAtual.createdAt)}</Campo>
                  {contratoAtual.origemGeracao === "humano" && decisaoComplementar ? (
                    <Campo label="Aprovado por" className="sm:col-span-2">
                      {decisaoComplementar.usuarioEmail ?? "analista não identificado"} em{" "}
                      {formatarData(decisaoComplementar.createdAt)}
                    </Campo>
                  ) : null}
                </dl>

                {podeAgir && agencia.status === STATUS_AGUARDANDO_ASSINATURA ? (
                  <div className="mt-4 flex flex-col gap-3">
                    <p className="text-muted-foreground text-sm">
                      Sem integração automática do D4Sign confirmando a assinatura ainda — registre
                      manualmente quando todos os signatários da fila acima tiverem assinado por
                      fora da plataforma.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <form action={marcarContratoAssinadoAction.bind(null, agencia.id)}>
                        <BotaoSubmitComLoading
                          labelCarregando="Registrando..."
                          className="bg-primary text-primary-foreground hover:bg-sakura-600 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Registrar assinatura
                        </BotaoSubmitComLoading>
                      </form>
                      <ForcarAvancoModal
                        agenciaId={agencia.id}
                        proximaEtapaLabel="Validação"
                        forcarAvancoStatusAction={forcarAvancoStatusAction}
                      />
                      <CancelarContratoModal
                        agenciaId={agencia.id}
                        cancelarContratoAction={cancelarContratoAction}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          {etapaExibida === indiceComplementar &&
          (!contratoAtual || contratoAtual.status === CONTRATO_STATUS_CANCELADO) ? (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-sm">
                {contratoAtual
                  ? "O contrato anterior foi cancelado — aprove de novo pra gerar um contrato novo. Veja o motivo no histórico de edições, logo acima."
                  : "A IA sinalizou algo pra revisar neste cadastro antes de gerar o contrato — nenhum contrato foi criado ainda. Veja o parecer completo na ficha do cliente, logo acima."}
              </p>

              {documentosNaoAprovados.length > 0 ? (
                <div className="border-warning/30 bg-warning/5 text-warning rounded-xl border px-4 py-3 text-sm">
                  <strong>Documentos ainda não aprovados:</strong>{" "}
                  {documentosNaoAprovados.map((doc) => doc.label).join(", ")} — revise-os na seção
                  de documentos antes de aprovar.
                </div>
              ) : null}

              {podeAgir ? (
                <div className="flex flex-wrap gap-2">
                  {complementar ? (
                    <AprovarComplementarModal
                      razaoSocial={agencia.razaoSocial}
                      cnpj={agencia.cnpj}
                      enderecoAgencia={complementar.enderecoAgencia}
                      representantesLegais={representantesLegais}
                      aprovarComplementarAction={aprovarComplementarAction.bind(null, agencia.id)}
                      disabled={documentosNaoAprovados.length > 0}
                    />
                  ) : null}
                  <RecusarCadastroModal
                    agenciaId={agencia.id}
                    recusarCadastroAction={recusarCadastroAction}
                  />
                  <form action={reprocessarAnaliseAction.bind(null, agencia.id)}>
                    <BotaoSubmitComLoading
                      labelCarregando="Reprocessando..."
                      className="flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-500 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Reprocessar análise de IA
                    </BotaoSubmitComLoading>
                  </form>
                </div>
              ) : null}
            </div>
          ) : null}

          {etapaExibida === indiceValidacao ? (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-sm">
                Todos os sócios assinaram (provedor: {contratoAtual?.provedorId ?? "—"},{" "}
                {labelOrigemContrato(contratoAtual?.origemGeracao ?? null)}).{" "}
                {contratoAtual?.origemGeracao === "externo"
                  ? "Este contrato foi assinado fora da plataforma — não há evidência de selfie/documento/vídeo selfie coletada pelo D4Sign, só o documento em si."
                  : "Confira as evidências de assinatura (selfie, documento e vídeo selfie de cada sócio) no documento assinado. Assim que o aprovador do time de cadastro assinar no D4Sign, o cadastro avança sozinho para Cadastramento."}
              </p>

              <FilaAssinatura fila={filaAssinatura} agenciaId={agencia.id} />
              {podeAgir ? <SincronizarContratoD4SignButton agenciaId={agencia.id} /> : null}

              {contratoAtual ? (
                <div>
                  <VisualizarDocumento
                    url={`/api/cadastros/contratos/${contratoAtual.id}/arquivo`}
                    label="Contrato D4Sign"
                  >
                    <span className="border-input text-foreground hover:bg-accent flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition">
                      <Eye className="size-3.5" />
                      Visualizar Documento
                    </span>
                  </VisualizarDocumento>
                </div>
              ) : null}

              {podeAgir ? (
                <div className="flex flex-wrap gap-2">
                  <ForcarAvancoModal
                    agenciaId={agencia.id}
                    proximaEtapaLabel="Cadastramento"
                    forcarAvancoStatusAction={forcarAvancoStatusAction}
                  />
                  <CancelarContratoModal
                    agenciaId={agencia.id}
                    cancelarContratoAction={cancelarContratoAction}
                  />
                  <RecusarCadastroModal
                    agenciaId={agencia.id}
                    recusarCadastroAction={recusarCadastroAction}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {etapaExibida === indiceAtivo ? (
            <div className="bg-success-bg flex flex-col items-center gap-1.5 rounded-2xl px-6 py-8 text-center">
              <CheckCircle2 className="text-success size-10" />
              <p className="text-success-text text-lg font-bold">Cliente ativo</p>
              <p className="text-success-text text-sm">
                Onboarding concluído — a agência está pronta pra operar.
              </p>
            </div>
          ) : null}

          {agencia.status === STATUS_RECUSADO ? (
            <div className="flex flex-col gap-1">
              <p className="text-destructive text-sm font-medium">Cadastro recusado.</p>
              {registroRecusa ? (
                <p className="text-muted-foreground text-xs">
                  Por{" "}
                  <span className="text-foreground font-medium">{registroRecusa.editadoPor}</span>{" "}
                  em {formatarData(registroRecusa.createdAt)} — motivo:{" "}
                  {registroRecusa.justificativa}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </SecaoColapsavel>

      {/* Separado do bloco "Contrato" (decisão do usuário, 2026-07-27) —
          SICA/TravelLink (etapa Cadastramento) e Usuário Master (etapa
          Ativação) são credenciais/acessos, não contrato. Só aparece
          nessas duas etapas; nas outras (Complementar/Assinatura/Validação/
          Ativo) não tem nada pra mostrar aqui. */}
      {etapaExibida === indiceCadastramento || etapaExibida === indiceAtivacao ? (
        <SecaoColapsavel
          titulo="SICA/TravelLink"
          icon={<KeyRound className="size-4" />}
          defaultAberta
        >
          <div className="flex flex-col gap-3">
            {etapaExibida === indiceCadastramento ? (
              <ValidacaoSicaTravelLink
                agenciaId={agencia.id}
                razaoSocial={agencia.razaoSocial}
                cnpj={agencia.cnpj}
                enderecoFormatado={enderecoAgenciaTravelLink}
                telefoneContato={agencia.telefoneContato}
                telefoneComercial={complementar?.telefoneComercial ?? null}
                associacaoNome={associacaoNome}
                promotorNome={executivoNome}
                nomeContato={socioContatoTravelLink?.nome ?? null}
                emailContato={socioContatoTravelLink?.email ?? null}
                bancoLabel={bancoLabelTravelLink}
                bancoAgencia={complementar?.bancoAgencia ?? null}
                bancoConta={complementar?.bancoConta ?? null}
                favorecidoNome={complementar?.favorecidoNome ?? null}
                favorecidoDoc={complementar?.favorecidoDoc ?? null}
                sicaCodigo={agencia.sicaCodigo}
                sicaSalvoPor={agencia.sicaSalvoPor}
                sicaSalvoEm={agencia.sicaSalvoEm}
                travelLinkCriado={agencia.travelLinkCriado}
                travelLinkSalvoPor={agencia.travelLinkSalvoPor}
                travelLinkSalvoEm={agencia.travelLinkSalvoEm}
                salvarSicaAction={salvarSicaAction}
                salvarTravelLinkAction={salvarTravelLinkAction}
                confirmarCadastramentoAction={confirmarCadastramentoAction}
                somenteLeitura={!podeAgir}
                amat={analiseCredito.amat}
                rawAmat={analiseCredito.rawAmat}
                historicoAmat={analiseCredito.historicoAmat}
                sofia={analiseCredito.sofia}
                rawSofia={analiseCredito.rawSofia}
                historicoSofia={analiseCredito.historicoSofia}
                reconsultarAmat={reconsultarCreditoAction.bind(null, agencia.id, "AMAT")}
                reconsultarSofia={reconsultarCreditoAction.bind(null, agencia.id, "SOFIA")}
                consultaSica={consultaSica}
                reconsultarSica={consultarSicaAction.bind(null, agencia.id)}
                atualizarSicaAction={atualizarSicaAction.bind(null, agencia.id)}
              />
            ) : null}

            {etapaExibida === indiceAtivacao ? (
              <>
                {/* Contrato/SICA continuam decorativos aqui: chegar
                    nesta etapa só é possível depois de "Confirmar
                    Cadastramento" — botão que já trava (ver
                    ValidacaoSicaTravelLink) até SICA e TravelLink
                    estarem preenchidos. TravelLink, porém, reflete o
                    valor real de agencia.travelLinkCriado (decisão do
                    usuário, 2026-07-27: quem for criar o Usuário Master
                    precisa confiar no check, não só inferir da etapa). */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <ChecklistEtapaConcluida label="Contrato" />
                  <ChecklistEtapaConcluida label="SICA" />
                  <ChecklistEtapaConcluida
                    label="TravelLink"
                    concluida={agencia.travelLinkCriado}
                  />
                </div>

                <UsuarioMaster
                  agenciaId={agencia.id}
                  representantesLegais={representantesLegais}
                  usuarioMaster={usuarioMasterView}
                  somenteLeitura={!podeAgir}
                  salvarUsuarioMasterAction={salvarUsuarioMasterAction}
                />

                <div className="border-border bg-muted/40 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs">
                  <strong className="text-foreground">Não implementado ainda:</strong> os checks
                  acima confirmam que SICA e TravelLink foram preenchidos antes de chegar aqui, mas
                  o código/link em si não é salvo — schema ainda não tem campo pra isso (sinalizando
                  em vez de simular dado falso).
                </div>
                {podeAgir ? (
                  <div className="flex flex-wrap gap-2">
                    <form action={ativarClienteAction.bind(null, agencia.id)}>
                      <BotaoSubmitComLoading
                        labelCarregando="Ativando..."
                        disabled={!usuarioMasterEstaCompleto(usuarioMasterView)}
                        title={
                          usuarioMasterEstaCompleto(usuarioMasterView)
                            ? undefined
                            : "Salve o Usuário Master completo antes de ativar o cliente"
                        }
                        className="bg-primary text-primary-foreground hover:bg-sakura-600 disabled:hover:bg-primary flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Ativar cliente
                      </BotaoSubmitComLoading>
                    </form>
                    <RecusarCadastroModal
                      agenciaId={agencia.id}
                      recusarCadastroAction={recusarCadastroAction}
                    />
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </SecaoColapsavel>
      ) : null}
    </div>
  );
}
