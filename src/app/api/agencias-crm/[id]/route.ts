import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { httpError, httpOk } from "@/modules/shared/presentation/http-response";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { montarAgenciaDetalheView } from "@/modules/agencias-crm/adapters/agencia-detalhe.adapter";
import { usaSstReal } from "@/modules/agencias-crm/infrastructure/agencia-sst-client.util";
import { agenciaDetalheSstService } from "@/modules/agencias-crm/services/agencia-detalhe.sst-service";
import { agenciaCarteiraSstService } from "@/modules/agencias-crm/services/agencia-carteira.sst-service";

const CARGOS_COM_ACESSO = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

// obterMetricasCarteira() é cacheada (10min) mas cara em cache frio (a
// varredura paginada de terrestre da carteira inteira já mediu ~47s numa
// chamada real) — pra ela nunca travar a abertura do modal, corre em
// paralelo com obterVendas() e tem um teto de espera: se não voltar a
// tempo, o modal segue com o diasSemComprar/dataUltimaCompra que
// obterVendas() já calculou por conta própria (mais rápido, janela
// menor) em vez de esperar a carteira inteira.
const TIMEOUT_METRICAS_CARTEIRA_MS = 5_000;

function comTimeout<T>(promessa: Promise<T>, ms: number, valorPadrao: T): Promise<T> {
  return Promise.race([
    promessa,
    new Promise<T>((resolve) => setTimeout(() => resolve(valorPadrao), ms)),
  ]);
}

// Detalhe sob demanda pro modal de Agências (SPEC_AGENCIAS_SAKURA.md,
// seção 4) — chamado client-side quando uma linha da listagem é clicada
// (ver use-agencia-detalhe.view-model.ts). Reaproveita o mesmo motor real
// de /cadastros/:id (obterDetalhe/obterDadosReceita), só monta a view
// comercial (real + mock) por cima.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    return httpError("Acesso não permitido.", 403);
  }

  const detalhe = await cadastroAdminController.obterDetalhe(params.id);
  if (!detalhe) {
    return httpError("Agência não encontrada.", 404);
  }

  const [dadosReceita, promotores] = await Promise.all([
    cadastroAdminController.obterDadosReceita(params.id).catch(() => null),
    atribuicoesAdminController.listarPromotores(),
  ]);

  const executivo = detalhe.agencia.executivoId
    ? (promotores.find((promotor) => promotor.id === detalhe.agencia.executivoId) ?? null)
    : null;

  const gestorNome = executivo?.gestorId
    ? ((await atribuicoesAdminController.listarGestores()).find(
        (gestor) => gestor.id === executivo.gestorId,
      )?.nome ?? null)
    : null;

  // Sem SST_API_KEY, ou sem sicaCodigo nesta agência, o bloco "vendas"
  // segue 100% mock (comportamento idêntico ao de antes desta
  // integração) — mesmo critério de agencia-carteira.loader.ts.
  const sicaCodigo = detalhe.agencia.sicaCodigo;
  const usaSst = usaSstReal() && Boolean(sicaCodigo);

  // "Última compra"/"dias sem comprar" do modal usam a MESMA fonte da
  // listagem (janela de 365d via resumo-agrupado, cacheada 10min) em vez
  // do cálculo de obterVendas (janela mais curta, 14-90d, só pra achar
  // uma amostra de reservas recentes) — evita o modal mostrar uma data
  // diferente da que já apareceu na linha da tabela pro mesmo sicaCodigo.
  // As duas chamadas só dependem de sicaCodigo (não uma da outra), então
  // correm em paralelo — nunca sequencial.
  const [vendasReais, metricasCarteira] = await Promise.all([
    usaSst
      ? agenciaDetalheSstService.obterVendas(sicaCodigo!).catch((erro) => {
          console.error(
            "[agencias-crm] Falha ao buscar vendas reais do SST — modal segue 100% mock.",
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

  return httpOk(view);
}
