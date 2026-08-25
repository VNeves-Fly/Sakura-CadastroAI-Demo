import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import {
  montarAgenciaDetalheView,
  montarAgenciaDetalheViewSst,
} from "@/modules/agencias-crm/adapters/agencia-detalhe.adapter";
import { AgenciaDetalheView } from "@/modules/agencias-crm/views/agencia-detalhe-view";
import { NotFoundError } from "@/modules/shared/domain/errors";
import { usaSstReal } from "@/modules/agencias-crm/infrastructure/agencia-sst-client.util";
import {
  agenciaDetalheSstService,
  type CadastroComercialSst,
  type VendasReaisSst,
} from "@/modules/agencias-crm/services/agencia-detalhe.sst-service";
import { agenciaCarteiraSstService } from "@/modules/agencias-crm/services/agencia-carteira.sst-service";
import type { AgenciaDetalhe } from "@/modules/cadastro/domain/repositories/agencia-repository";

const CARGOS_COM_ACESSO = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

// obterMetricasCarteira() é cacheada (10min) mas cara em cache frio (a
// varredura paginada de terrestre da carteira inteira já mediu ~47s numa
// chamada real) — pra ela nunca travar a abertura da página, corre em
// paralelo com obterVendas() e tem um teto de espera: se não voltar a
// tempo, a página segue com o diasSemComprar/dataUltimaCompra que
// obterVendas() já calculou por conta própria (mais rápido, janela
// menor) em vez de esperar a carteira inteira.
const TIMEOUT_METRICAS_CARTEIRA_MS = 5_000;

function comTimeout<T>(promessa: Promise<T>, ms: number, valorPadrao: T): Promise<T> {
  return Promise.race([
    promessa,
    new Promise<T>((resolve) => setTimeout(() => resolve(valorPadrao), ms)),
  ]);
}

// "Última compra"/"dias sem comprar" usam a MESMA fonte da listagem
// (janela de 365d via resumo-agrupado, cacheada 10min) em vez do cálculo
// de obterVendas (janela mais curta, 14-90d) — evita a página mostrar
// uma data diferente da que já apareceu na linha da tabela pro mesmo
// código.
async function obterVendasComMetricasDaCarteira(
  sicaCodigo: string,
): Promise<VendasReaisSst | null> {
  const [vendasReais, metricasCarteira] = await Promise.all([
    agenciaDetalheSstService.obterVendas(sicaCodigo).catch((erro) => {
      console.error(
        "[agencias-crm] Falha ao buscar vendas reais do SST — página segue 100% mock.",
        erro,
      );
      return null;
    }),
    comTimeout(
      agenciaCarteiraSstService.obterMetricasCarteira().catch(() => null),
      TIMEOUT_METRICAS_CARTEIRA_MS,
      null,
    ),
  ]);

  const metrica = metricasCarteira?.get(sicaCodigo);
  if (vendasReais && metrica?.dataUltimaCompra) {
    vendasReais.diasSemComprar = metrica.diasSemComprar;
    vendasReais.dataUltimaCompra = metrica.dataUltimaCompra;
  }
  return vendasReais;
}

// Código SICA (dígitos puros) — identidade vinda do roster do SST
// (/crm/agencias, aba Agências do executivo: essas listagens não têm id
// local, só código SICA, ver agencia-carteira.loader.ts). Um cuid local
// (aba Agências do Gestor, que ainda lê direto a tabela `Agencia`) nunca
// é só dígitos.
const REGEX_CODIGO_SICA = /^\d+$/;

// Caminho 100% SST (decisão do usuário, 2026-08-21: /crm/agencias é a
// carteira comercial do SST, não o funil de onboarding deste app). Sem
// SST_API_KEY não tem outra fonte pra essa página — 500 explícito (via
// throw, cai no error.tsx) em vez de tentar e estourar dentro de
// `sstGet`.
async function renderizarDetalheSst(codigoEmpresa: number) {
  if (!usaSstReal()) {
    throw new Error("Integração com o SST não está configurada.");
  }

  const [cadastroComercial, promotores, gestores] = await Promise.all([
    agenciaDetalheSstService
      .obterCadastroComercial(codigoEmpresa)
      .catch((erro): CadastroComercialSst => {
        console.error("[agencias-crm] Falha ao buscar cadastro comercial do SST.", erro);
        return { baseEmpresa: null, cadastro: null };
      }),
    atribuicoesAdminController.listarPromotores(),
    atribuicoesAdminController.listarGestores(),
  ]);

  if (!cadastroComercial.baseEmpresa) {
    notFound();
  }

  // Gestor/base/executivo são melhor esforço via Promotor.sica — única
  // hierarquia Executivo→Gestor que existe, o SST não modela Gestor.
  // MESMO critério de agencia-carteira.adapter.ts (promotorPorSica): casa
  // contra `codigo_executivo` (o código do executivo responsável por
  // ESTA agência, devolvido pelo SST em base-empresa-cadastro), não
  // contra o `codigoEmpresa` da própria agência — comparar contra
  // codigoEmpresa (bug anterior) quase nunca batia com o sica de um
  // executivo, então Gestor praticamente nunca aparecia (bug reportado
  // pelo usuário, 2026-08-25).
  const codigoExecutivoSst = cadastroComercial.baseEmpresa.codigo_executivo;
  const promotor = promotores.find((item) => item.sica === codigoExecutivoSst) ?? null;
  const gestorNome = promotor?.gestorId
    ? (gestores.find((gestor) => gestor.id === promotor.gestorId)?.nome ?? null)
    : null;

  const vendasReais = await obterVendasComMetricasDaCarteira(String(codigoEmpresa));

  const view = montarAgenciaDetalheViewSst(
    codigoEmpresa,
    cadastroComercial,
    { base: promotor?.bases[0] ?? null, gestorNome, executivoNome: promotor?.nome ?? null },
    vendasReais,
  );
  if (!view) {
    notFound();
  }

  return <AgenciaDetalheView detalhe={view} />;
}

// Dossiê local (aba Agências do Gestor, ou qualquer link direto com o id
// real de uma agência que passou pelo cadastro/onboarding deste app) —
// inalterado, reaproveita o motor de /cadastros/:id.
async function renderizarDetalheLocal(id: string) {
  // `obterDetalhe` lança NotFoundError pra id inexistente (não retorna
  // null) — sem este catch, um id inválido derrubava a página inteira
  // com um erro não tratado em vez de cair no not-found.tsx normal do
  // Next (bug reportado pelo usuário, 2026-08-21).
  let detalhe: AgenciaDetalhe;
  try {
    detalhe = await cadastroAdminController.obterDetalhe(id);
  } catch (erro) {
    if (erro instanceof NotFoundError) notFound();
    throw erro;
  }

  const [dadosReceita, promotores, gestores] = await Promise.all([
    cadastroAdminController.obterDadosReceita(id).catch(() => null),
    atribuicoesAdminController.listarPromotores(),
    atribuicoesAdminController.listarGestores(),
  ]);

  const executivo = detalhe.agencia.executivoId
    ? (promotores.find((promotor) => promotor.id === detalhe.agencia.executivoId) ?? null)
    : null;

  const gestorNome = executivo?.gestorId
    ? (gestores.find((gestor) => gestor.id === executivo.gestorId)?.nome ?? null)
    : null;

  // Sem SST_API_KEY, ou sem sicaCodigo nesta agência, o bloco "vendas"
  // segue 100% mock (comportamento idêntico ao de antes desta
  // integração) — mesmo critério de agencia-carteira.loader.ts.
  const sicaCodigo = detalhe.agencia.sicaCodigo;
  const vendasReais =
    usaSstReal() && sicaCodigo ? await obterVendasComMetricasDaCarteira(sicaCodigo) : null;

  const view = montarAgenciaDetalheView(
    detalhe,
    dadosReceita,
    { base: executivo?.bases[0] ?? null, gestorNome },
    vendasReais,
  );

  return <AgenciaDetalheView detalhe={view} />;
}

// Página de detalhe da Agência (/crm/agencias/[id]) — mesmo esqueleto de
// /crm/executivos/[id] e /crm/gestores/[id]. `:id` decide o caminho: só
// dígitos (código SICA, vindo do roster do SST) → 100% SST; qualquer
// outra coisa (cuid local, aba Agências do Gestor) → dossiê local.
export default async function AgenciaDetalhePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  if (REGEX_CODIGO_SICA.test(params.id)) {
    return renderizarDetalheSst(Number(params.id));
  }

  return renderizarDetalheLocal(params.id);
}
