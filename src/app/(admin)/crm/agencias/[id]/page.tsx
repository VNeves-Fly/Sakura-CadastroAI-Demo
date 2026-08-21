import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { montarAgenciaDetalheView } from "@/modules/agencias-crm/adapters/agencia-detalhe.adapter";
import { AgenciaDetalheView } from "@/modules/agencias-crm/views/agencia-detalhe-view";
import { NotFoundError } from "@/modules/shared/domain/errors";
import { usaSstReal } from "@/modules/agencias-crm/infrastructure/agencia-sst-client.util";
import { agenciaDetalheSstService } from "@/modules/agencias-crm/services/agencia-detalhe.sst-service";
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

// CNPJ (14 dígitos) — jeito de distinguir um id vindo do roster do SST
// (/crm/agencias, aba Agências do executivo: essas listagens não têm id
// local, só CNPJ) de um cuid local de verdade (aba Agências do Gestor,
// que ainda lê direto da tabela `Agencia` e já manda o id certo).
const REGEX_CNPJ = /^\d{14}$/;

// Página de detalhe da Agência (/crm/agencias/[id]) — mesmo esqueleto de
// /crm/executivos/[id] e /crm/gestores/[id] (guard → controller → notFound
// → Promise.all pra dado relacionado → adapter → View). Reaproveita o
// mesmo motor real de /cadastros/:id (obterDetalhe/obterDadosReceita) que
// antes alimentava a API /api/agencias-crm/:id do modal — a rota interna
// foi removida junto com o modal, essa página busca direto via
// controller, sem round-trip HTTP (mesmo padrão de Executivo/Gestor).
export default async function AgenciaDetalhePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  let agenciaLocalId = params.id;
  if (REGEX_CNPJ.test(params.id)) {
    const porCnpj = await cadastroAdminController.buscarPorCnpj(params.id);
    if (!porCnpj) {
      // Agência real na carteira comercial (SST), mas nunca passou pelo
      // cadastro/onboarding deste app — não existe dossiê pra montar.
      notFound();
    }
    agenciaLocalId = porCnpj.id;
  }

  // `obterDetalhe` lança NotFoundError pra id inexistente (não retorna
  // null — diferente de buscarPromotorPorId/Gestor usado em Executivo/
  // Gestor); sem este catch, um id inválido (ex.: linha mock em
  // /crm/agencias) derrubava a página inteira com um erro não tratado em
  // vez de cair no not-found.tsx normal do Next (bug reportado pelo
  // usuário, 2026-08-21).
  let detalhe: AgenciaDetalhe;
  try {
    detalhe = await cadastroAdminController.obterDetalhe(agenciaLocalId);
  } catch (erro) {
    if (erro instanceof NotFoundError) notFound();
    throw erro;
  }

  const [dadosReceita, promotores, gestores] = await Promise.all([
    cadastroAdminController.obterDadosReceita(agenciaLocalId).catch(() => null),
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
  const usaSst = usaSstReal() && Boolean(sicaCodigo);

  // "Última compra" do detalhe usa a MESMA fonte da listagem (janela de
  // 365d via resumo-agrupado, cacheada 10min) em vez do cálculo de
  // obterVendas (janela mais curta, 14-90d, só pra achar uma amostra de
  // vendas recentes) — evita a página mostrar uma data diferente da que
  // já apareceu na linha da tabela pro mesmo sicaCodigo. As duas
  // chamadas só dependem de sicaCodigo (não uma da outra), então correm
  // em paralelo — nunca sequencial.
  const [vendasReais, metricasCarteira] = await Promise.all([
    usaSst
      ? agenciaDetalheSstService.obterVendas(sicaCodigo!).catch((erro) => {
          console.error(
            "[agencias-crm] Falha ao buscar vendas reais do SST — página segue 100% mock.",
            erro,
          );
          return null;
        })
      : Promise.resolve(null),
    usaSst
      ? comTimeout(
          agenciaCarteiraSstService.obterMetricasCarteira().catch(() => null),
          TIMEOUT_METRICAS_CARTEIRA_MS,
          null,
        )
      : Promise.resolve(null),
  ]);

  const metrica = sicaCodigo ? metricasCarteira?.get(sicaCodigo) : undefined;
  if (vendasReais && metrica?.dataUltimaCompra) {
    vendasReais.diasSemComprar = metrica.diasSemComprar;
    vendasReais.dataUltimaCompra = metrica.dataUltimaCompra;
  }

  const view = montarAgenciaDetalheView(
    detalhe,
    dadosReceita,
    { base: executivo?.bases[0] ?? null, gestorNome },
    vendasReais,
  );

  return <AgenciaDetalheView detalhe={view} />;
}
