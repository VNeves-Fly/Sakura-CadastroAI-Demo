import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Users,
  Landmark,
  FileSignature,
  FileCheck2,
  CheckCircle2,
  ScrollText,
  FolderCheck,
  Bell,
} from "lucide-react";
import { SecaoColapsavel } from "@/modules/admin/components/secao-colapsavel";
import {
  Campo,
  formatarData,
  formatarDataCurta,
  formatarMoedaBrl,
  formatarEnderecoReceita,
  SubsecaoLabel,
  SituacaoCadastralBadge,
  CnaesDetalhe,
  CampoDocumento,
  AnaliseIaDetalhe,
  ParecerIa,
} from "@/modules/admin/components/dossie-campos";
import { RevisaoDocumentosComplementar } from "@/modules/admin/components/revisao-documentos";
import {
  ConsultaAmatCard,
  ConsultaSofiaCard,
} from "@/modules/admin/components/consulta-amat-sofia";
import { consultarAmat, consultarSofia } from "@/modules/admin/utils/mock-amat-sofia.util";
import { ValidacaoSicaTravelLink } from "./validacao-sica-travel-link";
import { FilaAssinatura } from "./fila-assinatura";
import { ContratoIdManual } from "./contrato-id-manual";
import { UsuarioMaster } from "./usuario-master";
import { CnpjCopiavel } from "./cnpj-copiavel";
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
import { resolverOrigemEvento } from "@/modules/eventos/utils/resolver-origem.util";
import {
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
  solicitarReenvioDocumentosAction,
  ativarClienteAction,
  marcarContratoAssinadoAction,
  recusarCadastroAction,
  validarContratoAction,
  salvarSicaAction,
  salvarTravelLinkAction,
  salvarUsuarioMasterAction,
} from "./actions";

function ChecklistEtapaConcluida({ label }: { label: string }) {
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
                href={atual ? `/painel/${agenciaId}` : `/painel/${agenciaId}?etapa=${index}`}
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
  searchParams: { etapa?: string };
}) {
  const view = await obterDossieView(params.id);

  if (!view) {
    notFound();
  }

  const {
    agencia,
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
    dadosReceita,
    usuarioMaster,
  } = view;

  const usuarioMasterView = paraUsuarioMasterView(usuarioMaster);
  const reenviosAguardandoRevisao = documentosAguardandoRevisaoPosReenvio(documentosAtivos);

  const sociosParaConsulta = representantesLegais.map((socio) => ({
    id: socio.id,
    nome: socio.nome,
    cpf: socio.cpf,
  }));
  const [amat, sofia] = await Promise.all([
    consultarAmat(sociosParaConsulta),
    consultarSofia(agencia.cnpj, sociosParaConsulta),
  ]);

  // Etapas concluídas ficam navegáveis em modo leitura (?etapa=N na URL) —
  // etapas futuras (index > indiceTrilha) são ignoradas e caem no fallback
  // pra etapa atual, mesma coisa se o cadastro foi recusado (a trilha não
  // é navegável nesse caso, ver TrilhaProgresso).
  const etapaParam = Number(searchParams?.etapa);
  const etapaValida = Number.isInteger(etapaParam) && etapaParam >= 0 && etapaParam <= indiceTrilha;
  const etapaExibida = !trilhaRecusada && etapaValida ? etapaParam : indiceTrilha;
  const mostrandoEtapaAtual = etapaExibida === indiceTrilha;

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
  const origemEvento = resolverOrigemEvento(agencia.origem);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl bg-[#fdf1f7] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-bold tracking-wide text-[#72243e]">{agencia.razaoSocial}</h1>
          {/* Gestor/Base escondidos até existir fonte de dado real (aguardando
              modelagem no backend) — mostrar "—" com tooltip parecia
              funcionalidade quebrada, não um espaço reservado pro futuro.
              Evento/Executivo já dá pra resolver via o mock de /eventos
              (ver resolver-origem.util.ts) a partir de Agencia.origem. */}
          {origemEvento ? (
            <div className="flex shrink-0 items-center gap-2">
              <span className="bg-accent text-accent-foreground rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap">
                {origemEvento.eventoNome}
              </span>
              <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap">
                {origemEvento.executivoNome}
              </span>
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

      {!mostrandoEtapaAtual ? (
        <div className="border-primary/30 bg-primary/5 text-primary flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed px-4 py-3 text-sm">
          <span>
            Modo leitura — revendo a etapa <strong>{ETAPAS_PIPELINE[etapaExibida]?.label}</strong>,
            já concluída. Nenhuma ação pode ser feita aqui.
          </span>
          <Link
            href={`/painel/${agencia.id}`}
            className="bg-primary text-primary-foreground hover:bg-sakura-600 shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition"
          >
            Voltar pra etapa atual
          </Link>
        </div>
      ) : null}

      {!complementar ? (
        <div className="border-border bg-card text-muted-foreground rounded-2xl border p-6 text-sm">
          Dados complementares não encontrados pra esta agência.
        </div>
      ) : (
        <>
          <SecaoColapsavel titulo="Empresa" icon={<Building2 className="size-4" />}>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <Campo label="E-mail de Contato">{agencia.emailContato || "—"}</Campo>
              <Campo label="Telefone Comercial">{complementar.telefoneComercial || "—"}</Campo>
              <Campo label="E-mail Operacional">{complementar.emailOperacional || "—"}</Campo>
              <Campo label="E-mail Comercial">{complementar.emailComercial || "—"}</Campo>
              <Campo label="E-mail Financeiro">{complementar.emailFinanceiro || "—"}</Campo>
              <Campo label="Contrato Social">
                <CampoDocumento documento={contratoSocial} />
              </Campo>
              <Campo label="Análise de IA" className="sm:col-span-2">
                <AnaliseIaDetalhe analise={analiseIaContratoSocial} />
              </Campo>
            </dl>
          </SecaoColapsavel>

          <SecaoColapsavel titulo="Dados da Receita" icon={<ScrollText className="size-4" />}>
            {!dadosReceita ? (
              <p className="text-muted-foreground text-sm">
                Dados da Receita não disponíveis — cadastro anterior a esta funcionalidade (só
                cadastros novos passam a gravar esse dado).
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                  <Campo label="Situação Cadastral">
                    <SituacaoCadastralBadge situacao={dadosReceita.situacaoCadastral} />
                  </Campo>
                  <Campo label="Natureza Jurídica">{dadosReceita.naturezaJuridica || "—"}</Campo>
                  <Campo label="Porte">{dadosReceita.porte || "—"}</Campo>
                  <Campo label="Capital Social">
                    {formatarMoedaBrl(dadosReceita.capitalSocial)}
                  </Campo>
                  <Campo label="Data de Abertura">
                    {dadosReceita.dataAbertura ? formatarDataCurta(dadosReceita.dataAbertura) : "—"}
                  </Campo>
                  <Campo label="Optante pelo Simples">
                    {dadosReceita.optanteSimples
                      ? `Sim${dadosReceita.dataOpcaoSimples ? ` (desde ${formatarDataCurta(dadosReceita.dataOpcaoSimples)})` : ""}`
                      : "Não"}
                  </Campo>
                </dl>

                <div className="flex flex-col gap-2">
                  <SubsecaoLabel>Contato</SubsecaoLabel>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                    <Campo label="Telefone (Receita)">{dadosReceita.telefone || "—"}</Campo>
                    <Campo label="E-mail (Receita)">{dadosReceita.email || "—"}</Campo>
                  </dl>
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

          <ConsultaAmatCard amat={amat} />
          <ConsultaSofiaCard sofia={sofia} />

          <SecaoColapsavel titulo="Sócios" icon={<Users className="size-4" />}>
            <div className="flex flex-col gap-3">
              {representantesLegais.map((socio) => (
                <div
                  key={socio.id}
                  className="border-border bg-muted/40 flex flex-col gap-2 rounded-xl border px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-foreground font-semibold">{socio.nome}</span>
                    {socio.isRepresentanteLegal ? (
                      <span className="bg-primary/15 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                        Representante legal
                      </span>
                    ) : null}
                  </div>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                    <Campo label="CPF">{socio.cpf}</Campo>
                    <Campo label="E-mail">{socio.email}</Campo>
                    <Campo label="Telefone">{socio.telefone}</Campo>
                    <Campo label="Estado Civil">{labelEstadoCivil(socio.estadoCivil)}</Campo>
                    <Campo label="Endereço" className="sm:col-span-2">
                      {formatarEndereco(socio.endereco)}
                    </Campo>
                    <Campo label="RG/CNH">
                      <CampoDocumento documento={socio.rg} />
                    </Campo>
                    {socio.procuracao ? (
                      <Campo label="Procuração">
                        <CampoDocumento documento={socio.procuracao} />
                      </Campo>
                    ) : null}
                    <Campo label="Análise de IA (RG)" className="sm:col-span-2">
                      <AnaliseIaDetalhe analise={analiseIaPorSocioId.get(socio.id) ?? null} />
                    </Campo>
                  </dl>
                </div>
              ))}
            </div>
          </SecaoColapsavel>

          <SecaoColapsavel titulo="Endereço & Banco" icon={<Landmark className="size-4" />}>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <Campo label="Endereço da Agência" className="sm:col-span-2">
                {formatarEndereco(complementar.enderecoAgencia)}
              </Campo>
              <Campo label="Banco">
                {complementar.bancoCodigo ? `${complementar.bancoCodigo} - ` : ""}
                {complementar.bancoNome} ({labelBancoPais(complementar.bancoPais ?? "")})
              </Campo>
              <Campo label="Tipo de Conta">{labelTipoConta(complementar.tipoConta ?? "")}</Campo>
              <Campo label="Agência">{complementar.bancoAgencia}</Campo>
              <Campo label="Conta">{complementar.bancoConta}</Campo>
              <Campo label="Favorecido" className="sm:col-span-2">
                {complementar.favorecidoNome} — {complementar.favorecidoDoc}
              </Campo>
            </dl>
          </SecaoColapsavel>
        </>
      )}

      {/* Documentação sempre visível, em qualquer etapa do funil — antes
          só existia dentro da etapa "Complementar", então um reenvio
          chegando depois dela (ex: agência já em Assinatura/Validação)
          não tinha onde ser revisado. Aprovar/reprovar continua liberando
          quantas rodadas forem necessárias (reprovar de novo gera outro
          "aguardando reenvio", o cliente recebe o mesmo link de sempre). */}
      <SecaoColapsavel titulo="Documentação" icon={<FolderCheck className="size-4" />}>
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
            documentosAtivos={documentosAtivos}
            documentosPendentes={documentosPendentes}
            aprovarDocumentoAction={aprovarDocumentoAction}
            reprovarDocumentoAction={reprovarDocumentoAction}
            solicitarReenvioDocumentosAction={solicitarReenvioDocumentosAction}
            somenteLeitura={!mostrandoEtapaAtual}
          />
        </div>
      </SecaoColapsavel>

      <SecaoColapsavel titulo="Contrato" icon={<FileSignature className="size-4" />} defaultAberta>
        <div className="flex flex-col gap-3">
          {contratoAtual && etapaExibida >= indiceAssinatura ? (
            <>
              <FilaAssinatura fila={filaAssinatura} />

              <div className="border-border bg-card border-l-primary/60 rounded-2xl border border-l-4 p-5">
                <span className="text-primary mb-3 flex items-center gap-2">
                  <FileCheck2 className="size-4" />
                  <span className="text-xs font-bold tracking-wide uppercase">
                    Contratos D4Sign
                  </span>
                </span>

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
                      provedorId={contratoAtual.provedorId}
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
                  falso. O ID de contrato assinado por fora também não persiste ainda (só nesta
                  tela, some se recarregar a página) — falta um campo novo no banco pra guardar isso
                  de verdade.
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
                contrato foi criado ainda.
              </p>

              <div className="border-border rounded-xl border px-4 py-3">
                <SubsecaoLabel>Parecer</SubsecaoLabel>
                <div className="mt-2">
                  <ParecerIa parecer={parecerIa} />
                </div>
              </div>

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
                </div>
              ) : null}
            </div>
          ) : null}

          {etapaExibida === indiceValidacao ? (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-sm">
                Contrato assinado (provedor: {contratoAtual?.provedorId ?? "—"},{" "}
                {labelOrigemContrato(contratoAtual?.origemGeracao ?? null)}). Confira o contrato
                assinado e valide antes de seguir pra ativação.
              </p>
              <ValidacaoSicaTravelLink
                agenciaId={agencia.id}
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
              />
            </div>
          ) : null}

          {etapaExibida === indiceAtivacao ? (
            <div className="flex flex-col gap-3">
              {/* Contrato/SICA/Travel Link sempre marcados aqui: chegar
                  nesta etapa só é possível depois de "Validar Contrato" —
                  botão que já trava (ver ValidacaoSicaTravelLink) até
                  SICA e Travel Link estarem preenchidos. Mesmo raciocínio
                  de calcularProgressoTrilha: inferir do status real da
                  agência em vez de exigir um campo novo só pra repetir
                  uma garantia que o fluxo anterior já impõe. */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <ChecklistEtapaConcluida label="Contrato" />
                <ChecklistEtapaConcluida label="SICA" />
                <ChecklistEtapaConcluida label="Travel Link" />
              </div>

              <UsuarioMaster
                agenciaId={agencia.id}
                representantesLegais={representantesLegais}
                usuarioMaster={usuarioMasterView}
                somenteLeitura={!mostrandoEtapaAtual}
                salvarUsuarioMasterAction={salvarUsuarioMasterAction}
              />

              <div className="border-border bg-muted/40 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs">
                <strong className="text-foreground">Não implementado ainda:</strong> os checks acima
                confirmam que SICA e Travel Link foram preenchidos antes de chegar aqui, mas o
                código/link em si não é salvo — schema ainda não tem campo pra isso (sinalizando em
                vez de simular dado falso).
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
    </div>
  );
}
