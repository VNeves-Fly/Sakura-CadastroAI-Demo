import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Building2, Users, Landmark, FileSignature } from "lucide-react";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import { SecaoColapsavel } from "./secao-colapsavel";
import { RevisaoDocumentosComplementar, type DocumentoRevisao } from "./revisao-documentos";
import { ValidacaoSicaTravelLink } from "./validacao-sica-travel-link";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { maskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import { labelStatus, classesBadgeStatus } from "@/modules/admin/utils/status-cadastro.util";
import { ESTADO_CIVIL_OPCOES } from "@/modules/cadastro/types/socio-wizard.types";
import {
  TIPO_CONTA_OPCOES,
  BANCO_PAIS_OPCOES,
} from "@/modules/cadastro/types/endereco-banco.types";
import {
  STATUS_ATIVO,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_COMPLEMENTAR,
  STATUS_RECUSADO,
  CONTRATO_STATUS_ASSINADO,
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

function labelOrigemContrato(origem: "ia" | "humano" | null): string {
  if (origem === "ia") return "gerado pela IA";
  if (origem === "humano") return "gerado pelo analista";
  return "origem desconhecida";
}

function labelEstadoCivil(valor: string): string {
  return ESTADO_CIVIL_OPCOES.find((opcao) => opcao.valor === valor)?.label ?? valor;
}

function labelTipoConta(valor: string): string {
  return TIPO_CONTA_OPCOES.find((opcao) => opcao.valor === valor)?.label ?? valor;
}

function labelBancoPais(valor: string): string {
  return BANCO_PAIS_OPCOES.find((opcao) => opcao.valor === valor)?.label ?? valor;
}

function formatarEndereco(endereco: {
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
}): string {
  if (!endereco.logradouro) return "—";
  return `${endereco.logradouro}, ${endereco.numero || "s/n"} — ${endereco.bairro}, ${endereco.cidade}/${endereco.uf}`;
}

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

// D4Sign avisou (webhook type_post=2) que o convite pra assinar nunca
// chegou nesse e-mail — sem isso, o signatário fica esperando pra sempre
// um convite que não existe.
function BadgeEmailNaoEntregue() {
  return (
    <span
      className="bg-destructive/15 text-destructive rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase"
      title="O e-mail de convite pra assinatura não foi entregue — confirme o endereço com o signatário."
    >
      E-mail não entregue
    </span>
  );
}

const ETAPAS_PIPELINE = [
  { status: STATUS_EM_COMPLEMENTAR, label: "Complementar" },
  { status: STATUS_AGUARDANDO_ASSINATURA, label: "Assinatura" },
  { status: STATUS_AGUARDANDO_VALIDACAO, label: "Validação" },
  { status: STATUS_AGUARDANDO_ATIVACAO, label: "Ativação" },
  { status: STATUS_ATIVO, label: "Ativo" },
];

// Trilha só informativa — o fluxo é sequencial (o analista não navega
// livremente entre etapas, cada uma libera a próxima por uma ação real),
// então não é clicável, só mostra onde a agência está agora. "Recusado"
// não é uma etapa da trilha (é uma saída do fluxo normal): usamos a
// existência de um Contrato como sinal real de onde a recusa aconteceu
// (com contrato = recusado depois de enviado; sem contrato = recusado
// ainda em Complementar) em vez de inventar um campo novo pra isso.
function TrilhaProgresso({ status, temContrato }: { status: string; temContrato: boolean }) {
  const recusado = status === STATUS_RECUSADO;
  const indiceAtual = recusado
    ? temContrato
      ? 1
      : 0
    : ETAPAS_PIPELINE.findIndex((etapa) => etapa.status === status);

  return (
    <div className="flex items-start">
      {ETAPAS_PIPELINE.map((etapa, index) => {
        const concluida = index < indiceAtual;
        const atual = index === indiceAtual;
        return (
          <div key={etapa.status} className="flex flex-1 flex-col items-center last:flex-none">
            <div className="flex w-full items-center">
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
              {index < ETAPAS_PIPELINE.length - 1 ? (
                <div className={`h-0.5 flex-1 ${concluida ? "bg-primary" : "bg-muted"}`} />
              ) : null}
            </div>
            <span className="text-muted-foreground mt-1 text-center text-[10px] font-medium whitespace-nowrap uppercase">
              {atual && recusado ? "Recusado" : etapa.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default async function DossieAgenciaPage({ params }: { params: { id: string } }) {
  const detalhe = await cadastroAdminController.obterDetalhe(params.id).catch(() => null);

  if (!detalhe) {
    notFound();
  }

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

  // Documentos revisáveis do cadastro complementar — contrato social +
  // RG/procuração de cada sócio, agora com o Documento real do banco
  // (id/status/motivoReprovacao), não mais um path solto inventado aqui.
  // Agências criadas antes desta tabela existir podem não ter um
  // Documento pra algum slot — nesse caso não entra na lista (nada real
  // pra aprovar/reprovar).
  function paraRevisao(documento: Documento | null, label: string): DocumentoRevisao[] {
    if (!documento) return [];
    return [
      {
        id: documento.id,
        label,
        gcsPath: documento.gcsPath,
        status: documento.status,
        motivoReprovacao: documento.motivoReprovacao,
      },
    ];
  }

  const documentosParaRevisao: DocumentoRevisao[] = [
    ...paraRevisao(contratoSocial, "Contrato Social"),
    ...representantesLegais.flatMap((socio) => [
      ...paraRevisao(socio.rg, `RG/CNH — ${socio.nome}`),
      ...paraRevisao(socio.procuracao, `Procuração — ${socio.nome}`),
    ]),
  ];

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
        <TrilhaProgresso status={agencia.status} temContrato={contratoAtual !== null} />
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="border-border bg-muted/30 rounded-xl border p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
                    Fase 1 — Sócios
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                      contratoAtual.status === CONTRATO_STATUS_ASSINADO
                        ? "bg-success/15 text-success"
                        : "bg-info/15 text-info"
                    }`}
                  >
                    {contratoAtual.status === CONTRATO_STATUS_ASSINADO ? "Assinado" : "Enviado"}
                  </span>
                </div>
                <ul className="flex flex-col gap-1 text-sm">
                  {representantesLegais.map((socio) => (
                    <li
                      key={socio.id}
                      className="text-foreground flex flex-wrap items-center gap-2"
                    >
                      {socio.nome}
                      {emailsNaoEntregues.has(socio.email) ? <BadgeEmailNaoEntregue /> : null}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-border bg-muted/30 rounded-xl border p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
                    Fase 2 — Sakura
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                      contratoAtual.status === CONTRATO_STATUS_ASSINADO
                        ? "bg-success/15 text-success"
                        : "bg-info/15 text-info"
                    }`}
                  >
                    {contratoAtual.status === CONTRATO_STATUS_ASSINADO ? "Assinado" : "Enviado"}
                  </span>
                </div>
                <ul className="flex flex-col gap-1 text-sm">
                  {signatariosPadraoAtivos.map((signatario) => (
                    <li
                      key={signatario.id}
                      className="text-foreground flex flex-wrap items-center gap-2"
                    >
                      {signatario.nome ?? signatario.email ?? "—"}
                      {signatario.email && emailsNaoEntregues.has(signatario.email) ? (
                        <BadgeEmailNaoEntregue />
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {agencia.status === STATUS_EM_COMPLEMENTAR ? (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-sm">
                A IA sinalizou algo pra revisar neste cadastro antes de gerar o contrato — nenhum
                contrato foi criado ainda.
              </p>

              <RevisaoDocumentosComplementar
                agenciaId={agencia.id}
                documentos={documentosParaRevisao}
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

          {agencia.status === STATUS_AGUARDANDO_ASSINATURA ? (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-sm">
                Contrato {labelOrigemContrato(contratoAtual?.origemGeracao ?? null)} (provedor:{" "}
                {contratoAtual?.provedorId ?? "—"}) e enviado por e-mail pros sócios assinarem. Sem
                integração real com o D4Sign ainda pra confirmar a assinatura automaticamente —
                marque manualmente quando todos tiverem assinado.
              </p>
              <div className="flex flex-wrap gap-2">
                <form action={marcarContratoAssinadoAction.bind(null, agencia.id)}>
                  <button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2 text-sm font-semibold transition"
                  >
                    Marcar como assinado
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
