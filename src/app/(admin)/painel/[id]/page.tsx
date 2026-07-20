import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Building2, Users, Landmark, FileSignature, FileCheck2 } from "lucide-react";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import { SecaoColapsavel } from "./secao-colapsavel";
import { RevisaoDocumentosComplementar } from "./revisao-documentos";
import { ValidacaoSicaTravelLink } from "./validacao-sica-travel-link";
import { FilaAssinatura } from "./fila-assinatura";
import { obterDossieView } from "@/modules/admin/view-models/dossie.view-model";
import {
  labelOrigemContrato,
  labelEstadoCivil,
  labelTipoConta,
  labelBancoPais,
  formatarEndereco,
  labelStatusContrato,
  ETAPAS_PIPELINE,
} from "@/modules/admin/adapters/dossie.adapter";
import { maskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import { labelStatus, classesBadgeStatus } from "@/modules/admin/utils/status-cadastro.util";
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
} from "./actions";

// Par rótulo/valor reaproveitado em todas as seções — rótulo tintado na cor
// de marca (em vez do cinza neutro anterior) e valor em destaque.
function Campo({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-primary/70 text-[11px] font-bold tracking-wide uppercase">{label}</dt>
      <dd className="text-foreground mt-0.5 text-sm font-medium break-words">{children}</dd>
    </div>
  );
}

function formatarData(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(data);
}

// Referência de arquivo (contrato social, RG, procuração) em destaque —
// mesmo tratamento de "código"/citação usado no mapa-redesign-sakura.html
// (fundo tintado + cor de marca + monoespaçada).
function Arquivo({ path }: { path: string }) {
  return (
    <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-xs font-semibold break-all">
      {path.split("/").pop()}
    </span>
  );
}

// Documento reprovado sai do rol "oficial" da ficha (Empresa/Sócios) —
// mostra que está faltando reenvio em vez do arquivo que foi rejeitado,
// já que o soft-delete só marca o status, não apaga a linha do banco.
function CampoDocumento({ documento }: { documento: Documento | null }) {
  if (!documento) return <span className="text-muted-foreground">—</span>;

  if (documento.status === "REPROVADO") {
    return (
      <span
        className="bg-warning/15 text-warning rounded-full px-2.5 py-0.5 text-xs font-bold uppercase"
        title={documento.motivoReprovacao ?? undefined}
      >
        Aguardando reenvio
      </span>
    );
  }

  return <Arquivo path={documento.gcsPath} />;
}

// Trilha só informativa — o fluxo é sequencial (o analista não navega
// livremente entre etapas, cada uma libera a próxima por uma ação real),
// então não é clicável, só mostra onde a agência está agora. Recebe o
// índice/recusado já calculados (ver calcularProgressoTrilha no
// adapter) — só decide como desenhar, não decide onde a agência está.
function TrilhaProgresso({ indiceAtual, recusado }: { indiceAtual: number; recusado: boolean }) {
  return (
    <div className="flex items-start">
      {ETAPAS_PIPELINE.map((etapa, index) => {
        const concluida = index < indiceAtual;
        const atual = index === indiceAtual;
        const ehUltima = index === ETAPAS_PIPELINE.length - 1;
        return (
          <div key={etapa.status} className={`flex items-start ${ehUltima ? "" : "flex-1"}`}>
            {/* Círculo e rótulo ficam juntos numa coluna de largura fixa
                (pelo conteúdo) — antes a linha conectora dividia espaço
                com o círculo na mesma linha, empurrando ele pra esquerda
                do rótulo (que fica centralizado na coluna toda). Assim o
                círculo sempre fica centralizado em cima do próprio número.
                O `flex-1` fica no wrapper (não só na linha) pra ela
                conseguir esticar de verdade dentro do espaço disponível. */}
            <div className="flex shrink-0 flex-col items-center">
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  atual && recusado
                    ? "bg-destructive text-destructive-foreground"
                    : concluida || atual
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {concluida ? "✓" : index + 1}
              </span>
              <span className="text-muted-foreground mt-1 text-center text-[10px] font-medium whitespace-nowrap uppercase">
                {atual && recusado ? "Recusado" : etapa.label}
              </span>
            </div>
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

export default async function DossieAgenciaPage({ params }: { params: { id: string } }) {
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
  } = view;

  return (
    <div className="flex flex-col gap-4">
      <div className="border-sakura-200 from-sakura-50 flex flex-col gap-3 rounded-2xl border bg-gradient-to-br via-white to-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="from-sakura-600 to-sakura-400 bg-gradient-to-r bg-clip-text text-2xl font-bold tracking-wide text-transparent uppercase">
            {agencia.razaoSocial}
          </h1>
          <div className="flex items-center gap-2">
            <span
              className="border-primary/30 bg-primary/10 text-primary rounded-full border border-dashed px-3 py-1 text-xs font-semibold"
              title="Executivo — sem fonte de dado real ainda, aguardando modelagem no backend"
            >
              Executivo: —
            </span>
            <span
              className="border-primary/30 bg-primary/10 text-primary rounded-full border border-dashed px-3 py-1 text-xs font-semibold"
              title="Gestor — sem fonte de dado real ainda, aguardando modelagem no backend"
            >
              Gestor: —
            </span>
            <span
              className="border-primary/30 bg-primary/10 text-primary rounded-full border border-dashed px-3 py-1 text-xs font-semibold"
              title="Base — sem fonte de dado real ainda, aguardando modelagem no backend"
            >
              Base: —
            </span>
          </div>
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
            {labelStatus(agencia.status)}
          </span>
        </div>
      </div>

      <div className="border-border bg-card rounded-2xl border p-5">
        <TrilhaProgresso indiceAtual={indiceTrilha} recusado={trilhaRecusada} />
      </div>

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
            </dl>
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

      <SecaoColapsavel titulo="Contrato" icon={<FileSignature className="size-4" />} defaultAberta>
        <div className="flex flex-col gap-3">
          {contratoAtual ? (
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
                  <Campo label="Documento D4Sign" className="sm:col-span-2">
                    <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-xs font-semibold break-all">
                      {contratoAtual.provedorId}
                    </span>
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

                {agencia.status === STATUS_AGUARDANDO_ASSINATURA ? (
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

          {agencia.status === STATUS_EM_COMPLEMENTAR ? (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-sm">
                A IA sinalizou algo pra revisar neste cadastro antes de gerar o contrato — nenhum
                contrato foi criado ainda.
              </p>

              <RevisaoDocumentosComplementar
                agenciaId={agencia.id}
                documentosAtivos={documentosAtivos}
                documentosPendentes={documentosPendentes}
                aprovarDocumentoAction={aprovarDocumentoAction}
                reprovarDocumentoAction={reprovarDocumentoAction}
                solicitarReenvioDocumentosAction={solicitarReenvioDocumentosAction}
              />

              <div className="border-border bg-muted/40 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs">
                <strong className="text-foreground">Parecer da IA indisponível:</strong> a
                normalização de dados do cadastro complementar não trouxe mais o campo estruturado
                do parecer (motivo/inconsistências/pontos a avaliar) — sinalizando aqui em vez de
                mostrar um parecer desatualizado ou inventado. Precisa alinhar com quem mexeu no
                schema onde esse dado deveria morar agora.
              </div>

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
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-full border px-4 py-2 text-sm font-medium transition"
                  >
                    Recusar
                  </button>
                </form>
              </div>
            </div>
          ) : null}

          {agencia.status === STATUS_AGUARDANDO_VALIDACAO ? (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-sm">
                Contrato assinado (provedor: {contratoAtual?.provedorId ?? "—"},{" "}
                {labelOrigemContrato(contratoAtual?.origemGeracao ?? null)}). Confira o contrato
                assinado e valide antes de seguir pra ativação.
              </p>
              <ValidacaoSicaTravelLink
                agenciaId={agencia.id}
                validarContratoAction={validarContratoAction}
                recusarCadastroAction={recusarCadastroAction}
              />
            </div>
          ) : null}

          {agencia.status === STATUS_AGUARDANDO_ATIVACAO ? (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-sm">
                Contrato validado (provedor: {contratoAtual?.provedorId ?? "—"}). Falta só criar
                SICA, Travel Link e usuário master e ativar o cliente.
              </p>
              <div className="border-border bg-muted/40 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs">
                <strong className="text-foreground">Não implementado ainda:</strong> criação de
                código SICA, Travel Link e credenciais de usuário master exigem campos novos no
                schema (não existem hoje) — sinalizando aqui em vez de simular dado falso. O botão
                abaixo só ativa o cliente, sem essas 3 etapas.
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={ativarClienteAction.bind(null, agencia.id)}>
                  <button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2 text-sm font-semibold transition"
                  >
                    Ativar cliente
                  </button>
                </form>
                <form action={recusarCadastroAction.bind(null, agencia.id)}>
                  <button
                    type="submit"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-full border px-4 py-2 text-sm font-medium transition"
                  >
                    Recusar
                  </button>
                </form>
              </div>
            </div>
          ) : null}

          {agencia.status === STATUS_ATIVO ? (
            <p className="text-success text-sm font-medium">Cliente ativo.</p>
          ) : null}

          {agencia.status === STATUS_RECUSADO ? (
            <p className="text-destructive text-sm font-medium">Cadastro recusado.</p>
          ) : null}
        </div>
      </SecaoColapsavel>
    </div>
  );
}
