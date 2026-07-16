import { notFound } from "next/navigation";
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
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import {
  aprovarComplementarAction,
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
            <span className="text-muted-foreground mt-1 line-clamp-1 max-w-[4.5rem] text-center text-[10px] font-medium tracking-wide uppercase">
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

  const { agencia, complementar, representantesLegais, contratos } = detalhe;
  const contratoAtual = contratos[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border bg-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5">
        <div>
          <h1 className="text-foreground text-lg font-semibold">{agencia.razaoSocial}</h1>
          <p className="text-muted-foreground text-sm">{maskCnpj(agencia.cnpj)}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${classesBadgeStatus(agencia.status)}`}
        >
          {labelStatus(agencia.status)}
        </span>
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
          <section className="border-border bg-card rounded-2xl border p-5">
            <h2 className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
              Empresa
            </h2>
            <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">E-mail de Contato</dt>
                <dd className="text-foreground font-medium break-words">{agencia.emailContato}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Telefone Comercial</dt>
                <dd className="text-foreground font-medium break-words">
                  {complementar.telefoneComercial || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">E-mail Operacional</dt>
                <dd className="text-foreground font-medium break-words">
                  {complementar.emailOperacional}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">E-mail Comercial</dt>
                <dd className="text-foreground font-medium break-words">
                  {complementar.emailComercial}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">E-mail Financeiro</dt>
                <dd className="text-foreground font-medium break-words">
                  {complementar.emailFinanceiro}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Contrato Social</dt>
                <dd className="text-foreground font-medium break-words">
                  {agencia.contratoSocialPath.split("/").pop()}
                </dd>
              </div>
            </dl>
          </section>

          <section className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5">
            <h2 className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
              Sócios
            </h2>
            {representantesLegais.map((socio) => (
              <div
                key={socio.id}
                className="border-border bg-muted/40 flex flex-col gap-1.5 rounded-xl border px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="text-foreground font-semibold">{socio.nome}</span>
                  {socio.isRepresentanteLegal ? (
                    <span className="bg-primary/15 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                      Representante legal
                    </span>
                  ) : null}
                </div>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">CPF</dt>
                    <dd className="text-foreground">{socio.cpf}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">E-mail</dt>
                    <dd className="text-foreground break-words">{socio.email}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Telefone</dt>
                    <dd className="text-foreground">{socio.telefone}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Estado Civil</dt>
                    <dd className="text-foreground">{labelEstadoCivil(socio.estadoCivil)}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">Endereço</dt>
                    <dd className="text-foreground">{formatarEndereco(socio.endereco)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">RG/CNH</dt>
                    <dd className="text-foreground">{socio.rgPath.split("/").pop()}</dd>
                  </div>
                  {socio.procuracaoPath ? (
                    <div>
                      <dt className="text-muted-foreground">Procuração</dt>
                      <dd className="text-foreground">{socio.procuracaoPath.split("/").pop()}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ))}
          </section>

          <section className="border-border bg-card rounded-2xl border p-5">
            <h2 className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
              Endereço & Banco
            </h2>
            <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Endereço da Agência</dt>
                <dd className="text-foreground font-medium">
                  {formatarEndereco(complementar.enderecoAgencia)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Banco</dt>
                <dd className="text-foreground font-medium">
                  {complementar.bancoNome} ({labelBancoPais(complementar.bancoPais ?? "")})
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tipo de Conta</dt>
                <dd className="text-foreground font-medium">
                  {labelTipoConta(complementar.tipoConta ?? "")}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Agência</dt>
                <dd className="text-foreground font-medium">{complementar.bancoAgencia}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Conta</dt>
                <dd className="text-foreground font-medium">{complementar.bancoConta}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Favorecido</dt>
                <dd className="text-foreground font-medium break-words">
                  {complementar.favorecidoNome} — {complementar.favorecidoDoc}
                </dd>
              </div>
            </dl>
          </section>
        </>
      )}

      <section className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5">
        <h2 className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
          Contrato
        </h2>

        {agencia.status === STATUS_EM_COMPLEMENTAR ? (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm">
              A IA sinalizou algo pra revisar neste cadastro antes de gerar o contrato — nenhum
              contrato foi criado ainda.
            </p>
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
              integração real com o D4Sign ainda pra confirmar a assinatura automaticamente — marque
              manualmente quando todos tiverem assinado.
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
            <div className="flex flex-wrap gap-2">
              <form action={validarContratoAction.bind(null, agencia.id)}>
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2 text-sm font-semibold transition"
                >
                  Validar Contrato
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

        {agencia.status === STATUS_AGUARDANDO_ATIVACAO ? (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm">
              Contrato validado (provedor: {contratoAtual?.provedorId ?? "—"}). Falta só criar SICA,
              Travel Link e usuário master e ativar o cliente.
            </p>
            <div className="border-border bg-muted/40 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs">
              <strong className="text-foreground">Não implementado ainda:</strong> criação de código
              SICA, Travel Link e credenciais de usuário master exigem campos novos no schema (não
              existem hoje) — sinalizando aqui em vez de simular dado falso. O botão abaixo só ativa
              o cliente, sem essas 3 etapas.
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
      </section>
    </div>
  );
}
