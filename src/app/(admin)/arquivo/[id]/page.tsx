import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Users,
  Landmark,
  FileSignature,
  ScrollText,
  FolderCheck,
  Sparkles,
  Eye,
} from "lucide-react";
import { SecaoColapsavel } from "@/modules/admin/components/secao-colapsavel";
import {
  Campo,
  CamposGrid,
  CampoEndereco,
  SubsecaoLabel,
  SituacaoCadastralBadge,
  CnaesDetalhe,
  CampoDocumento,
  ParecerIa,
  HistoricoDocumento,
  VerificacaoCadastral,
  UploadDocumentoOutro,
} from "@/modules/admin/components/dossie-campos";
import {
  formatarData,
  formatarDataCurta,
  formatarMoedaBrl,
  formatarEnderecoReceita,
  corFundoDocumento,
} from "@/modules/admin/utils/dossie-campos.util";
import { VisualizarDocumento } from "@/modules/admin/components/visualizar-documento";
import {
  ConsultaAmatCard,
  ConsultaSofiaCard,
} from "@/modules/admin/components/consulta-amat-sofia";
import type { DocumentoRevisao } from "@/modules/admin/types/dossie.types";
import { obterDossieView } from "@/modules/admin/view-models/dossie.view-model";
import {
  labelEstadoCivil,
  labelTipoConta,
  labelBancoPais,
  labelOrigemContrato,
  labelStatusContrato,
} from "@/modules/admin/adapters/dossie.adapter";
import { maskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import { classesBadgeStatus } from "@/modules/admin/utils/status-cadastro.util";
import { labelStatusArquivo } from "@/modules/admin/utils/status-arquivo.util";
import {
  STATUS_ATIVO,
  STATUS_RECUSADO,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import { reativarClienteAction, inserirDocumentoArquivoAction } from "./actions";

const ABAS = [
  { chave: "dossie", label: "Dossiê" },
  { chave: "documentacao", label: "Documentação" },
] as const;

// Lista de consulta (sem aprovar/reprovar — uma agência já finalizada não
// reabre essa decisão). Atualização de documentação (novo upload mantendo o
// antigo no histórico) acontece só via CampoDocumento (aba Dossiê, para
// Contrato Social/RG/Procuração) ou UploadDocumentoOutro (seção "Outros
// documentos", abaixo) — nunca daqui.
function ListaDocumentos({
  documentosAtivos,
  documentosPendentes,
}: {
  documentosAtivos: DocumentoRevisao[];
  documentosPendentes: DocumentoRevisao[];
}) {
  if (documentosAtivos.length === 0 && documentosPendentes.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhum documento encontrado.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {documentosAtivos.map((doc) => (
        <div
          key={doc.id}
          className="border-border bg-muted/30 flex flex-col gap-2 rounded-xl border px-4 py-2.5 text-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-foreground font-medium">{doc.label}</span>
            <VisualizarDocumento documentoId={doc.id} gcsPath={doc.gcsPath} label={doc.label}>
              <span className="text-primary text-xs font-semibold">Ver documento</span>
            </VisualizarDocumento>
          </div>
          <HistoricoDocumento historico={doc.historico} />
        </div>
      ))}
      {documentosPendentes.map((doc) => (
        <div
          key={doc.id}
          className="border-warning/30 bg-warning/5 flex flex-col gap-2 rounded-xl border px-4 py-2.5 text-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-foreground font-medium">{doc.label}</span>
            <span className="bg-warning-bg text-warning-text rounded-full px-2.5 py-0.5 text-xs font-bold uppercase">
              Aguardando reenvio
            </span>
          </div>
          <HistoricoDocumento historico={doc.historico} />
        </div>
      ))}
    </div>
  );
}

export default async function ArquivoDossiePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { aba?: string };
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
    contratos,
    contratoAtual,
    documentosAtivos,
    documentosPendentes,
    documentosOutros,
    analiseIaContratoSocial,
    analiseIaPorSocioId,
    parecerIa,
    analiseCredito,
    verificacaoCadastral,
    dadosReceita,
    historicoEdicoesEmpresa,
  } = view;

  // Arquivo só existe pra estados finais — qualquer outro status ainda
  // está em andamento no funil normal (ver /cadastros/[id]).
  if (agencia.status !== STATUS_ATIVO && agencia.status !== STATUS_RECUSADO) {
    redirect(`/cadastros/${agencia.id}`);
  }

  const abaAtual = ABAS.find((aba) => aba.chave === searchParams.aba) ?? ABAS[0];
  const reprovada = agencia.status === STATUS_RECUSADO;
  // Item mais recente do histórico de edições da própria Agencia cujo
  // alteracoes.status.para seja "recusado" (ver RecusarCadastroUseCase) —
  // undefined em cadastros recusados antes desta funcionalidade existir.
  const registroRecusa = historicoEdicoesEmpresa.find(
    (item) => item.entidade === "Agencia" && item.alteracoes.status?.para === STATUS_RECUSADO,
  );
  // Atualizar documentação (upload mantendo histórico) só faz sentido pra
  // quem já está finalizado como cliente — Recusada continua 100%
  // somente-leitura (decisão do usuário, 2026-07-29).
  const podeAtualizarDocumentos = agencia.status === STATUS_ATIVO;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl bg-[#fdf1f7] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-bold tracking-wide text-[#72243e]">{agencia.razaoSocial}</h1>
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
            <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-base font-bold">
              {maskCnpj(agencia.cnpj)}
            </span>
          </p>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${classesBadgeStatus(agencia.status)}`}
          >
            {labelStatusArquivo(agencia.status)}
          </span>
        </div>

        {/* Reativação: só Reprovada -> Ativa. O caminho inverso (Ativa ->
            Reprovada) não existe por aqui de propósito — desativar um
            cliente ativo é uma decisão que não deve virar 1 clique dentro
            do arquivo. */}
        {reprovada ? (
          <>
            {registroRecusa ? (
              <p className="text-muted-foreground text-sm">
                Recusado por{" "}
                <span className="text-foreground font-medium">{registroRecusa.editadoPor}</span> em{" "}
                {formatarData(registroRecusa.createdAt)} — motivo: {registroRecusa.justificativa}
              </p>
            ) : null}
            <form action={reativarClienteAction.bind(null, agencia.id)} className="w-fit">
              <button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2 text-sm font-semibold transition"
              >
                Tornar Ativa
              </button>
            </form>
          </>
        ) : null}
      </div>

      {/* Abas — Dossiê (leitura) e Documentação (lista de consulta com
          "Ver documento" por item, ver ListaDocumentos acima). */}
      <div className="flex gap-2">
        {ABAS.map((aba) => {
          const ativa = aba.chave === abaAtual.chave;
          return (
            <Link
              key={aba.chave}
              href={`/arquivo/${agencia.id}?aba=${aba.chave}`}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                ativa
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              {aba.label}
            </Link>
          );
        })}
      </div>

      {abaAtual.chave === "dossie" ? (
        <>
          {!complementar ? (
            <div className="border-border bg-card text-muted-foreground rounded-2xl border p-6 text-sm">
              Dados complementares não encontrados pra esta agência.
            </div>
          ) : (
            <>
              <SecaoColapsavel titulo="Empresa" icon={<Building2 className="size-4" />}>
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
                      inserirDocumentoManualAction={inserirDocumentoArquivoAction}
                      somenteLeitura={!podeAtualizarDocumentos}
                    />
                  </Campo>
                </CamposGrid>
              </SecaoColapsavel>

              <SecaoColapsavel titulo="Parecer da IA" icon={<Sparkles className="size-4" />}>
                <ParecerIa parecer={parecerIa} />
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

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ConsultaAmatCard
                  amat={analiseCredito.amat}
                  rawAmat={analiseCredito.rawAmat}
                  historico={analiseCredito.historicoAmat}
                />
                <ConsultaSofiaCard
                  sofia={analiseCredito.sofia}
                  rawSofia={analiseCredito.rawSofia}
                  historico={analiseCredito.historicoSofia}
                />
              </div>

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
                      <CamposGrid>
                        <Campo label="CPF">{socio.cpf}</Campo>
                        <Campo label="E-mail">{socio.email}</Campo>
                        <Campo label="Telefone">{socio.telefone}</Campo>
                        <Campo label="Estado Civil">{labelEstadoCivil(socio.estadoCivil)}</Campo>
                        <CampoEndereco label="Endereço" endereco={socio.endereco} />
                        <Campo label="RG/CNH" corFundo={corFundoDocumento(socio.rg)}>
                          <CampoDocumento
                            documento={socio.rg}
                            analise={analiseIaPorSocioId.get(socio.id) ?? null}
                            agenciaId={agencia.id}
                            tipo="RG_CNPJ"
                            representanteLegalId={socio.id}
                            inserirDocumentoManualAction={inserirDocumentoArquivoAction}
                            somenteLeitura={!podeAtualizarDocumentos}
                          />
                        </Campo>
                        {socio.procuracao ? (
                          <Campo label="Procuração" corFundo={corFundoDocumento(socio.procuracao)}>
                            <CampoDocumento
                              documento={socio.procuracao}
                              agenciaId={agencia.id}
                              tipo="PROCURACAO"
                              representanteLegalId={socio.id}
                              inserirDocumentoManualAction={inserirDocumentoArquivoAction}
                              somenteLeitura={!podeAtualizarDocumentos}
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
                  <CampoEndereco
                    label="Endereço da Agência"
                    endereco={complementar.enderecoAgencia}
                  />
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

          <SecaoColapsavel titulo="Contrato" icon={<FileSignature className="size-4" />}>
            {contratoAtual ? (
              <div className="flex flex-col gap-3">
                <div className="flex justify-end">
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
                  <Campo label="Status">{labelStatusContrato(contratoAtual.status)}</Campo>
                  <Campo label="Origem">{labelOrigemContrato(contratoAtual.origemGeracao)}</Campo>
                  <Campo label="ID do Contrato" className="sm:col-span-2">
                    {contratoAtual.provedorId}
                  </Campo>
                  <Campo label="Criado em">{formatarData(contratoAtual.createdAt)}</Campo>
                </dl>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Nenhum contrato foi gerado pra esta agência.
              </p>
            )}
          </SecaoColapsavel>
        </>
      ) : (
        <>
          {/* Histórico completo — não só o contrato vigente (contratoAtual)
              mostrado na aba Dossiê. Fica aqui pra quando a agência renovar o
              contrato: os anteriores continuam acessíveis (decisão do
              usuário, 2026-07-29). */}
          <SecaoColapsavel
            titulo="Contratos"
            icon={<FileSignature className="size-4" />}
            defaultAberta
          >
            {contratos.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum contrato foi gerado pra esta agência.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {contratos.map((contrato) => (
                  <div
                    key={contrato.id}
                    className="border-border bg-muted/30 flex flex-col gap-2 rounded-xl border px-4 py-2.5 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-foreground font-medium">
                          {labelStatusContrato(contrato.status)}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {labelOrigemContrato(contrato.origemGeracao)} — criado em{" "}
                          {formatarData(contrato.createdAt)}
                        </span>
                      </span>
                      <VisualizarDocumento
                        url={`/api/cadastros/contratos/${contrato.id}/arquivo`}
                        label="Contrato D4Sign"
                      >
                        <span className="text-primary text-xs font-semibold">Ver documento</span>
                      </VisualizarDocumento>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SecaoColapsavel>

          <SecaoColapsavel
            titulo="Documentação"
            icon={<FolderCheck className="size-4" />}
            defaultAberta
          >
            <ListaDocumentos
              documentosAtivos={documentosAtivos}
              documentosPendentes={documentosPendentes}
            />
          </SecaoColapsavel>

          {/* Tipos fora dos slots fixos acima (Cadastur, Comprovante de
              Endereço, Certidão de Casamento, Outros) — só existem via
              upload manual daqui mesmo (ver paraDocumentosOutros). */}
          <SecaoColapsavel titulo="Outros documentos" icon={<FolderCheck className="size-4" />}>
            <div className="flex flex-col gap-3">
              {documentosOutros.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum documento adicional.</p>
              ) : (
                <ListaDocumentos documentosAtivos={documentosOutros} documentosPendentes={[]} />
              )}

              {podeAtualizarDocumentos ? (
                <UploadDocumentoOutro
                  agenciaId={agencia.id}
                  representantesLegais={representantesLegais}
                  inserirDocumentoArquivoAction={inserirDocumentoArquivoAction}
                />
              ) : null}
            </div>
          </SecaoColapsavel>
        </>
      )}
    </div>
  );
}
