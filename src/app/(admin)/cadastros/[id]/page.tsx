import { notFound } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import { SecaoColapsavel } from "@/modules/admin/components/secao-colapsavel";
import { VisualizarDocumento } from "@/modules/admin/components/visualizar-documento";
import {
  Campo,
  CamposGrid,
  SubsecaoLabel,
  SituacaoCadastralBadge,
  CnaesDetalhe,
  CampoDocumento,
  ParecerIa,
  corFundoDocumento,
  VerificacaoCadastral,
} from "@/modules/admin/components/dossie-campos";
import {
  formatarData,
  formatarDataCurta,
  formatarMoedaBrl,
  formatarEnderecoReceita,
} from "@/modules/admin/utils/dossie-campos.util";
import { RevisaoDocumentosComplementar } from "@/modules/admin/components/revisao-documentos";
import {
  ConsultaAmatCard,
  ConsultaSofiaCard,
} from "@/modules/admin/components/consulta-amat-sofia";
import { ValidacaoSicaTravelLink } from "./validacao-sica-travel-link";
import { EditarSocioForm } from "./editar-socio-form";
import { EditarEmpresaForm } from "./editar-empresa-form";
import { FilaAssinatura } from "./fila-assinatura";
import { ContratoIdManual } from "./contrato-id-manual";
import { UsuarioMaster } from "./usuario-master";
import { CnpjCopiavel } from "./cnpj-copiavel";
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
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_COMPLEMENTAR,
  STATUS_RECUSADO,
  CONTRATO_STATUS_ASSINADO,
  CONTRATO_STATUS_ASSINADO_AGENCIA,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import {
  aprovarComplementarAction,
  aprovarDocumentoAction,
  reprovarDocumentoAction,
  inserirDocumentoManualAction,
  editarSocioAction,
  editarEmpresaAction,
  solicitarReenvioDocumentosAction,
  ativarClienteAction,
  marcarContratoAssinadoAction,
  recusarCadastroAction,
  reprocessarAnaliseAction,
  reconsultarCreditoAction,
  validarContratoAction,
  salvarSicaAction,
  salvarTravelLinkAction,
  salvarUsuarioMasterAction,
} from "./actions";

// `concluida` default true — Contrato/SICA continuam decorativos (chegar
// na etapa Ativação já implica que passaram), só Travel Link passou a
// checar de verdade (agencia.travelLinkCriado, ver TravelLinkSecao).
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
    indiceTrilha,
    trilhaRecusada,
    analiseIaContratoSocial,
    analiseIaPorSocioId,
    parecerIa,
    analiseCredito,
    verificacaoCadastral,
    dadosReceita,
    usuarioMaster,
    historicoEdicoesPorSocioId,
    historicoEdicoesEmpresa,
  } = view;

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
  // pode agir no cadastro, só consultar.
  const somenteLeituraExterna = searchParams?.leitura === "1";
  const mostrandoEtapaAtual = etapaExibida === indiceTrilha && !somenteLeituraExterna;

  const indiceComplementar = ETAPAS_PIPELINE.findIndex(
    (etapa) => etapa.status === STATUS_EM_COMPLEMENTAR,
  );
  const indiceAssinatura = ETAPAS_PIPELINE.findIndex(
    (etapa) => etapa.status === STATUS_AGUARDANDO_ASSINATURA,
  );
  const indiceValidacao = ETAPAS_PIPELINE.findIndex(
    (etapa) => etapa.status === STATUS_AGUARDANDO_VALIDACAO,
  );
  const indiceAtivacao = ETAPAS_PIPELINE.findIndex(
    (etapa) => etapa.status === STATUS_AGUARDANDO_ATIVACAO,
  );
  const indiceAtivo = ETAPAS_PIPELINE.findIndex((etapa) => etapa.status === STATUS_ATIVO);

  // Dados pro formulário de leitura do Travel Link (ver TravelLinkSecao)
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
      <div className="flex items-center justify-between gap-3">
        <VoltarButton />
        <AtendimentoButton agenciaId={agencia.id} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-[#fdf1f7] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-bold tracking-wide text-[#72243e]">{agencia.razaoSocial}</h1>
          {/* Gestor/Base escondidos até existir fonte de dado real (aguardando
              modelagem no backend) — mostrar "—" com tooltip parecia
              funcionalidade quebrada, não um espaço reservado pro futuro.
              Evento/Executivo/Associação vêm resolvidos de verdade agora
              (Agencia.eventoId/executivoId/associacaoId). */}
          {eventoNome || executivoNome || associacaoNome ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {eventoNome ? (
                <span className="bg-accent text-accent-foreground rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap">
                  {eventoNome}
                </span>
              ) : null}
              {executivoNome ? (
                <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap">
                  {executivoNome}
                </span>
              ) : null}
              {associacaoNome ? (
                <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap">
                  {associacaoNome}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-0.5 text-sm">
            <span>
              <span className="text-muted-foreground">E-mail:</span>{" "}
              <span className="text-foreground font-medium">{agencia.emailContato || "—"}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Telefone:</span>{" "}
              <span className="text-foreground font-medium">
                {complementar?.telefoneComercial || "—"}
              </span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground font-medium">CNPJ:</span>
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
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-sakura-600 shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition"
            >
              Reprocessar análise
            </button>
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
                  reconsultar={reconsultarCreditoAction.bind(null, agencia.id, "AMAT")}
                />
                <ConsultaSofiaCard
                  sofia={analiseCredito.sofia}
                  rawSofia={analiseCredito.rawSofia}
                  historico={analiseCredito.historicoSofia}
                  reconsultar={reconsultarCreditoAction.bind(null, agencia.id, "SOFIA")}
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
                    disabled={!mostrandoEtapaAtual}
                  />
                </div>
                <CamposGrid>
                  <Campo label="E-mail de Contato">{agencia.emailContato || "—"}</Campo>
                  <Campo label="Telefone Comercial">{complementar.telefoneComercial || "—"}</Campo>
                  <Campo label="E-mail Operacional">{complementar.emailOperacional || "—"}</Campo>
                  <Campo label="E-mail Comercial">{complementar.emailComercial || "—"}</Campo>
                  <Campo label="E-mail Financeiro">{complementar.emailFinanceiro || "—"}</Campo>
                  <Campo label="Contrato Social" corFundo={corFundoDocumento(contratoSocial)}>
                    <CampoDocumento
                      documento={contratoSocial}
                      analise={analiseIaContratoSocial}
                      agenciaId={agencia.id}
                      tipo="CONTRATO_SOCIAL"
                      representanteLegalId={null}
                      aprovarDocumentoAction={aprovarDocumentoAction}
                      reprovarDocumentoAction={reprovarDocumentoAction}
                      inserirDocumentoManualAction={inserirDocumentoManualAction}
                      somenteLeitura={!mostrandoEtapaAtual}
                      reenviado={
                        contratoSocial ? idsDocumentosReenviados.has(contratoSocial.id) : false
                      }
                    />
                  </Campo>
                </CamposGrid>
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
                            disabled={!mostrandoEtapaAtual}
                          />
                        </div>
                      </div>
                      <CamposGrid>
                        <Campo label="CPF">{socio.cpf}</Campo>
                        <Campo label="E-mail">{socio.email}</Campo>
                        <Campo label="Telefone">{socio.telefone}</Campo>
                        <Campo label="Estado Civil">{labelEstadoCivil(socio.estadoCivil)}</Campo>
                        <Campo label="Nacionalidade">{socio.nacionalidade || "—"}</Campo>
                        <Campo label="Endereço" className="sm:col-span-2">
                          {formatarEndereco(socio.endereco)}
                        </Campo>
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
                            somenteLeitura={!mostrandoEtapaAtual}
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
                              somenteLeitura={!mostrandoEtapaAtual}
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

              <SecaoColapsavel titulo="Endereço & Banco" icon={<Landmark className="size-4" />}>
                <CamposGrid>
                  <Campo label="Endereço da Agência" className="sm:col-span-2">
                    {formatarEndereco(complementar.enderecoAgencia)}
                  </Campo>
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
                somenteLeitura={!mostrandoEtapaAtual}
              />
            </div>
          </SecaoColapsavel>
        </>
      ) : null}

      <SecaoColapsavel titulo="Contrato" icon={<FileSignature className="size-4" />} defaultAberta>
        <div className="flex flex-col gap-3">
          {contratoAtual && etapaExibida === indiceAssinatura ? (
            <>
              <FilaAssinatura fila={filaAssinatura} />

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
                      somenteLeitura={!mostrandoEtapaAtual}
                    />
                  </Campo>
                  <Campo label="Criado em">{formatarData(contratoAtual.createdAt)}</Campo>
                </dl>

                <div className="border-border bg-muted/40 text-muted-foreground mt-4 rounded-xl border border-dashed px-4 py-3 text-xs">
                  <strong className="text-foreground">
                    Log de geração/revisão/envio indisponível:
                  </strong>{" "}
                  o histórico de auditoria (quem gerou, quem revisou e quem enviou o contrato, com
                  data/hora) não existe no schema hoje — sinalizando aqui em vez de simular um log
                  falso.
                </div>

                {mostrandoEtapaAtual && agencia.status === STATUS_AGUARDANDO_ASSINATURA ? (
                  <div className="mt-4 flex flex-col gap-3">
                    <p className="text-muted-foreground text-sm">
                      Sem integração automática do D4Sign confirmando a assinatura ainda — registre
                      manualmente quando todos os signatários da fila acima tiverem assinado por
                      fora da plataforma.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <form action={marcarContratoAssinadoAction.bind(null, agencia.id)}>
                        <button
                          type="submit"
                          className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2 text-sm font-semibold transition"
                        >
                          Registrar assinatura
                        </button>
                      </form>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          {etapaExibida === indiceComplementar ? (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-sm">
                A IA sinalizou algo pra revisar neste cadastro antes de gerar o contrato — nenhum
                contrato foi criado ainda. Veja o parecer completo na ficha do cliente, logo acima.
              </p>

              {mostrandoEtapaAtual ? (
                <div className="flex flex-wrap gap-2">
                  <form action={aprovarComplementarAction.bind(null, agencia.id)}>
                    <button
                      type="submit"
                      className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2 text-sm font-semibold transition"
                    >
                      Aprovar e Enviar Contrato
                    </button>
                  </form>
                  <form action={recusarCadastroAction.bind(null, agencia.id)}>
                    <button
                      type="submit"
                      className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-500 transition hover:bg-neutral-50"
                    >
                      Recusar
                    </button>
                  </form>
                  <form action={reprocessarAnaliseAction.bind(null, agencia.id)}>
                    <button
                      type="submit"
                      className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-500 transition hover:bg-neutral-50"
                    >
                      Reprocessar análise de IA
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          ) : null}

          {etapaExibida === indiceValidacao ? (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-sm">
                Contrato assinado (provedor: {contratoAtual?.provedorId ?? "—"},{" "}
                {labelOrigemContrato(contratoAtual?.origemGeracao ?? null)}). Confira o contrato
                assinado antes de seguir pra ativação — SICA e Travel Link ficam no bloco
                &ldquo;SICA/Travel Link&rdquo;, abaixo.
              </p>
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
            <p className="text-destructive text-sm font-medium">Cadastro recusado.</p>
          ) : null}
        </div>
      </SecaoColapsavel>

      {/* Separado do bloco "Contrato" (decisão do usuário, 2026-07-27) —
          SICA/Travel Link (etapa Validação) e Usuário Master (etapa
          Ativação) são credenciais/acessos, não contrato. Só aparece
          nessas duas etapas; nas outras (Complementar/Assinatura/Ativo)
          não tem nada pra mostrar aqui. */}
      {etapaExibida === indiceValidacao || etapaExibida === indiceAtivacao ? (
        <SecaoColapsavel
          titulo="SICA/Travel Link"
          icon={<KeyRound className="size-4" />}
          defaultAberta
        >
          <div className="flex flex-col gap-3">
            {etapaExibida === indiceValidacao ? (
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
                validarContratoAction={validarContratoAction}
                recusarCadastroAction={recusarCadastroAction}
                somenteLeitura={!mostrandoEtapaAtual}
                amat={analiseCredito.amat}
                rawAmat={analiseCredito.rawAmat}
                historicoAmat={analiseCredito.historicoAmat}
                sofia={analiseCredito.sofia}
                rawSofia={analiseCredito.rawSofia}
                historicoSofia={analiseCredito.historicoSofia}
                reconsultarAmat={reconsultarCreditoAction.bind(null, agencia.id, "AMAT")}
                reconsultarSofia={reconsultarCreditoAction.bind(null, agencia.id, "SOFIA")}
              />
            ) : null}

            {etapaExibida === indiceAtivacao ? (
              <>
                {/* Contrato/SICA continuam decorativos aqui: chegar
                    nesta etapa só é possível depois de "Validar
                    Contrato" — botão que já trava (ver
                    ValidacaoSicaTravelLink) até SICA e Travel Link
                    estarem preenchidos. Travel Link, porém, reflete o
                    valor real de agencia.travelLinkCriado (decisão do
                    usuário, 2026-07-27: quem for criar o Usuário Master
                    precisa confiar no check, não só inferir da etapa). */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <ChecklistEtapaConcluida label="Contrato" />
                  <ChecklistEtapaConcluida label="SICA" />
                  <ChecklistEtapaConcluida
                    label="Travel Link"
                    concluida={agencia.travelLinkCriado}
                  />
                </div>

                <UsuarioMaster
                  agenciaId={agencia.id}
                  representantesLegais={representantesLegais}
                  usuarioMaster={usuarioMasterView}
                  somenteLeitura={!mostrandoEtapaAtual}
                  salvarUsuarioMasterAction={salvarUsuarioMasterAction}
                />

                <div className="border-border bg-muted/40 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs">
                  <strong className="text-foreground">Não implementado ainda:</strong> os checks
                  acima confirmam que SICA e Travel Link foram preenchidos antes de chegar aqui, mas
                  o código/link em si não é salvo — schema ainda não tem campo pra isso (sinalizando
                  em vez de simular dado falso).
                </div>
                {mostrandoEtapaAtual ? (
                  <div className="flex flex-wrap gap-2">
                    <form action={ativarClienteAction.bind(null, agencia.id)}>
                      <button
                        type="submit"
                        disabled={!usuarioMasterEstaCompleto(usuarioMasterView)}
                        title={
                          usuarioMasterEstaCompleto(usuarioMasterView)
                            ? undefined
                            : "Salve o Usuário Master completo antes de ativar o cliente"
                        }
                        className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Ativar cliente
                      </button>
                    </form>
                    <form action={recusarCadastroAction.bind(null, agencia.id)}>
                      <button
                        type="submit"
                        className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-500 transition hover:bg-neutral-50"
                      >
                        Recusar
                      </button>
                    </form>
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
