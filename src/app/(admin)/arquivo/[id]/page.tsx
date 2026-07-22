import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Building2, Users, Landmark, FileSignature, ScrollText, FolderCheck } from "lucide-react";
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
} from "@/modules/admin/components/dossie-campos";
import { VisualizarDocumento } from "@/modules/admin/components/visualizar-documento";
import type { DocumentoRevisao } from "@/modules/admin/types/dossie.types";
import { obterDossieView } from "@/modules/admin/view-models/dossie.view-model";
import {
  labelEstadoCivil,
  labelTipoConta,
  labelBancoPais,
  formatarEndereco,
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
import { reativarClienteAction } from "./actions";

const ABAS = [
  { chave: "dossie", label: "Dossiê" },
  { chave: "documentacao", label: "Documentação" },
] as const;

// Aba Documentação do arquivo é só consulta — os documentos aqui já
// foram aprovados no funil (ver /painel/[id]); não faz sentido reabrir
// aprovar/reprovar por uma agência já finalizada (Ativa ou Reprovada).
// Um botão "Atualizar" (analista sobe uma versão nova, com log de quem/
// quando) ficou de fora por enquanto — exigiria uma coluna nova no
// banco pra registrar quem fez o upload, fora do escopo (só front)
// desta tarefa.
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
          className="border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm"
        >
          <span className="text-foreground font-medium">{doc.label}</span>
          <VisualizarDocumento documentoId={doc.id} gcsPath={doc.gcsPath} label={doc.label}>
            <span className="text-primary text-xs font-semibold">Ver documento</span>
          </VisualizarDocumento>
        </div>
      ))}
      {documentosPendentes.map((doc) => (
        <div
          key={doc.id}
          className="border-warning/30 bg-warning/5 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm"
        >
          <span className="text-foreground font-medium">{doc.label}</span>
          <span className="bg-warning-bg text-warning-text rounded-full px-2.5 py-0.5 text-xs font-bold uppercase">
            Aguardando reenvio
          </span>
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
    contratoAtual,
    documentosAtivos,
    documentosPendentes,
    analiseIaContratoSocial,
    analiseIaPorSocioId,
    dadosReceita,
  } = view;

  // Arquivo só existe pra estados finais — qualquer outro status ainda
  // está em andamento no funil normal (ver /painel/[id]).
  if (agencia.status !== STATUS_ATIVO && agencia.status !== STATUS_RECUSADO) {
    redirect(`/painel/${agencia.id}`);
  }

  const abaAtual = ABAS.find((aba) => aba.chave === searchParams.aba) ?? ABAS[0];
  const reprovada = agencia.status === STATUS_RECUSADO;

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
          <form action={reativarClienteAction.bind(null, agencia.id)} className="w-fit">
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2 text-sm font-semibold transition"
            >
              Tornar Ativa
            </button>
          </form>
        ) : null}
      </div>

      {/* Abas — Dossiê (leitura) e Documentação (analista pode aprovar/
          reprovar/solicitar reenvio, sempre editável independente do
          status ser Ativo ou Reprovado). */}
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
                </dl>
              </SecaoColapsavel>
            </>
          )}

          <SecaoColapsavel titulo="Contrato" icon={<FileSignature className="size-4" />}>
            {contratoAtual ? (
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Campo label="Status">{labelStatusContrato(contratoAtual.status)}</Campo>
                <Campo label="Origem">{labelOrigemContrato(contratoAtual.origemGeracao)}</Campo>
                <Campo label="ID do Contrato" className="sm:col-span-2">
                  {contratoAtual.provedorId}
                </Campo>
                <Campo label="Criado em">{formatarData(contratoAtual.createdAt)}</Campo>
              </dl>
            ) : (
              <p className="text-muted-foreground text-sm">
                Nenhum contrato foi gerado pra esta agência.
              </p>
            )}
          </SecaoColapsavel>
        </>
      ) : (
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
      )}
    </div>
  );
}
