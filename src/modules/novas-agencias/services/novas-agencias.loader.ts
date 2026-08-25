import {
  usaSstReal,
  comFallback,
  formatarDataIsoBrasilia,
} from "@/modules/agencias-crm/infrastructure/agencia-sst-client.util";
import { agenciaCarteiraSstService } from "@/modules/agencias-crm/services/agencia-carteira.sst-service";
import type { MetricasCarteiraSst } from "@/modules/agencias-crm/services/agencia-carteira.sst-service";
import { novasAgenciasSstService } from "@/modules/novas-agencias/services/novas-agencias.sst-service";
import { prismaNovasAgenciasRepository } from "@/modules/novas-agencias/infrastructure/prisma-novas-agencias.repository";
import { montarNovasAgenciasView } from "@/modules/novas-agencias/adapters/novas-agencias.adapter";
import type { NovasAgenciasData } from "@/modules/novas-agencias/types/novas-agencias.types";

// Orquestra: identidade/entrada (sempre Prisma real) + métricas de venda
// (SST real quando SST_API_KEY configurada, mock por linha no adapter
// como fallback). Mesmo padrão de agencia-carteira.loader.ts.

async function obterMetricasReaisOuNull(): Promise<Map<string, MetricasCarteiraSst> | null> {
  if (!usaSstReal()) return null;
  try {
    return await agenciaCarteiraSstService.obterMetricasCarteira();
  } catch (erro) {
    console.error(
      "[novas-agencias] Falha ao buscar métricas reais do SST — página segue 100% mock nas métricas de venda.",
      erro,
    );
    return null;
  }
}

export async function carregarNovasAgencias(): Promise<NovasAgenciasData> {
  const hoje = new Date();
  const [agenciasLocais, totalAtivasNoSistema] = await Promise.all([
    prismaNovasAgenciasRepository.listarAprovadasNaJanela(),
    prismaNovasAgenciasRepository.contarAtivasNoSistema(),
  ]);

  if (!usaSstReal()) {
    return montarNovasAgenciasView(agenciasLocais, null, new Map(), totalAtivasNoSistema, hoje);
  }

  const metricasPorCodigo = await obterMetricasReaisOuNull();

  // Só busca "1ª compra" pra quem: tem codigoEmpresa resolvido, métricas
  // reais disponíveis (metricasPorCodigo não é null) e teve venda
  // detectada (vendasAno > 0) — sem isso não há nenhuma venda pra achar.
  const candidatos = agenciasLocais
    .filter((agencia) => agencia.codigoEmpresa !== null)
    .map((agencia) => ({
      codigoEmpresa: String(agencia.codigoEmpresa),
      entradaIso: formatarDataIsoBrasilia(agencia.entradaEm),
      vendasAno: metricasPorCodigo?.get(String(agencia.codigoEmpresa))?.vendasAno ?? 0,
    }))
    .filter((candidato) => candidato.vendasAno > 0)
    .map(({ codigoEmpresa, entradaIso }) => ({ codigoEmpresa, entradaIso }));

  const primeirasComprasPorCodigo =
    candidatos.length > 0
      ? await comFallback(
          "primeiras-compras",
          novasAgenciasSstService.obterPrimeirasComprasPorAgencia(candidatos),
          new Map<string, string | null>(),
        )
      : new Map<string, string | null>();

  return montarNovasAgenciasView(
    agenciasLocais,
    metricasPorCodigo,
    primeirasComprasPorCodigo,
    totalAtivasNoSistema,
    hoje,
  );
}
