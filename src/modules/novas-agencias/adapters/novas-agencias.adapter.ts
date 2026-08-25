import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import { maskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import type { MetricasCarteiraSst } from "@/modules/agencias-crm/services/agencia-carteira.sst-service";
import type { AgenciaAprovadaLocal } from "@/modules/novas-agencias/infrastructure/prisma-novas-agencias.repository";
import {
  formatarMoedaBrl,
  formatarMoedaAbreviada,
  formatarPercentualDaBase,
  formatarDataBr,
} from "@/modules/novas-agencias/utils/formatar.util";
import type {
  NovasAgenciasData,
  AgenciaNovaLinha,
  SituacaoAgenciaNova,
} from "@/modules/novas-agencias/types/novas-agencias.types";

const DIAS_LIMITE_PAROU = 90; // mesma janela do rótulo "Comprando (90d)"/"Parou de comprar (+90d)"
const UM_DIA_MS = 86_400_000;

// nunca: sem venda detectada pra aquele codigoEmpresa (real "zero", não
// mock — a agência foi consultada no SST e ele não tem registro de venda).
export function derivarSituacao(metricas: MetricasCarteiraSst | undefined): SituacaoAgenciaNova {
  if (!metricas || metricas.vendasAno === 0) return "nunca";
  return metricas.diasSemComprar <= DIAS_LIMITE_PAROU ? "comprando" : "parou";
}

interface MetricasMock {
  vendasAno: number;
  situacao: SituacaoAgenciaNova;
  primeiraCompraEm: Date | null;
}

// Fallback determinístico (mesmo hash sempre gera a mesma linha) usado
// quando o SST está desligado/falhou (metricasPorCodigo === null) OU a
// agência nunca teve uma ConsultaSst de sucesso (sem codigoEmpresa pra
// consultar) — nesses dois casos não temos como saber o dado real, então
// não é seguro tratar como "nunca comprou" de verdade (diferente do caso
// "consultamos o SST e ele não achou venda", que é sinal real).
function gerarMetricasMock(seed: number, entradaEm: Date, hoje: Date): MetricasMock {
  const diasDesdeEntrada = Math.max(
    0,
    Math.floor((hoje.getTime() - entradaEm.getTime()) / UM_DIA_MS),
  );
  const semVenda = seed % 3 === 0 || diasDesdeEntrada === 0;
  if (semVenda) return { vendasAno: 0, situacao: "nunca", primeiraCompraEm: null };

  const diasParaPrimeiraCompra = 1 + (seed % Math.min(30, diasDesdeEntrada));
  const primeiraCompraEm = new Date(entradaEm.getTime() + diasParaPrimeiraCompra * UM_DIA_MS);
  const diasSemComprar = seed % 200;
  const situacao: SituacaoAgenciaNova = diasSemComprar <= DIAS_LIMITE_PAROU ? "comprando" : "parou";
  const vendasAno = ((seed % 900) + 20) * 1_000;

  return { vendasAno, situacao, primeiraCompraEm };
}

interface LinhaInterna {
  linha: AgenciaNovaLinha;
  vendasAno: number;
  entradaEm: Date;
  primeiraCompraEm: Date | null;
}

function montarLinha(
  agencia: AgenciaAprovadaLocal,
  metricasPorCodigo: Map<string, MetricasCarteiraSst> | null,
  primeirasComprasPorCodigo: Map<string, string | null>,
  hoje: Date,
): LinhaInterna {
  const codigoEmpresa = agencia.codigoEmpresa !== null ? String(agencia.codigoEmpresa) : null;
  const seed = hashParaNumero(agencia.id);

  let vendasAno: number;
  let situacao: SituacaoAgenciaNova;
  let primeiraCompraEm: Date | null;

  if (metricasPorCodigo !== null && codigoEmpresa !== null) {
    // Caminho real: consultamos o SST pra este codigoEmpresa. Ausência no
    // mapa é sinal real de "sem venda detectada", não mock (ver
    // derivarSituacao) — diferente de agencia-carteira.adapter.ts, que
    // mocka mesmo com o mapa presente; aqui a semântica da tela exige
    // distinguir "nunca comprou de verdade" de "não sabemos".
    const metricas = metricasPorCodigo.get(codigoEmpresa);
    situacao = derivarSituacao(metricas);
    vendasAno = metricas?.vendasAno ?? 0;
    const primeiraCompraIso =
      situacao !== "nunca" ? primeirasComprasPorCodigo.get(codigoEmpresa) : null;
    primeiraCompraEm = primeiraCompraIso ? new Date(primeiraCompraIso) : null;
  } else {
    // SST desligado/indisponível, ou agência sem ConsultaSst de sucesso —
    // não sabemos o dado real, cai no mock determinístico por hash.
    const mock = gerarMetricasMock(seed, agencia.entradaEm, hoje);
    vendasAno = mock.vendasAno;
    situacao = mock.situacao;
    primeiraCompraEm = mock.primeiraCompraEm;
  }

  return {
    linha: {
      id: agencia.id,
      nome: agencia.razaoSocial.toUpperCase(),
      meta: maskCnpj(agencia.cnpj),
      executivo: agencia.executivoNome ?? "não definido",
      gerente: agencia.gestorNome ?? "—",
      entrada: formatarDataBr(agencia.entradaEm),
      primeiraCompra: primeiraCompraEm ? formatarDataBr(primeiraCompraEm) : "—",
      volume: formatarMoedaBrl(vendasAno),
      situacao,
    },
    vendasAno,
    entradaEm: agencia.entradaEm,
    primeiraCompraEm,
  };
}

function diasEntre(inicio: Date, fim: Date): number {
  return Math.max(0, Math.round((fim.getTime() - inicio.getTime()) / UM_DIA_MS));
}

export function montarNovasAgenciasView(
  agenciasLocais: AgenciaAprovadaLocal[],
  metricasPorCodigo: Map<string, MetricasCarteiraSst> | null,
  primeirasComprasPorCodigo: Map<string, string | null>,
  totalAtivasNoSistema: number,
  hoje: Date,
): NovasAgenciasData {
  const linhas = agenciasLocais.map((agencia) =>
    montarLinha(agencia, metricasPorCodigo, primeirasComprasPorCodigo, hoje),
  );

  const total = linhas.length;
  const nuncaCompraram = linhas.filter((l) => l.linha.situacao === "nunca").length;
  const comprando = linhas.filter((l) => l.linha.situacao === "comprando").length;

  const volumeTotal = linhas.reduce((soma, l) => soma + l.vendasAno, 0);

  const diasParaPrimeiraCompra = linhas
    .filter((l) => l.primeiraCompraEm !== null)
    .map((l) => diasEntre(l.entradaEm, l.primeiraCompraEm!));
  const tempoMedio =
    diasParaPrimeiraCompra.length > 0
      ? Math.round(
          diasParaPrimeiraCompra.reduce((soma, dias) => soma + dias, 0) /
            diasParaPrimeiraCompra.length,
        )
      : 0;

  return {
    funil: {
      novasAgencias: total,
      novasAgenciasPct: "100% da base",
      nuncaCompraram,
      nuncaCompraramPct: formatarPercentualDaBase(nuncaCompraram, total),
      comprando,
      comprandoPct: formatarPercentualDaBase(comprando, total),
      baseAprovadas: totalAtivasNoSistema,
    },
    volumeGerado: formatarMoedaAbreviada(volumeTotal),
    tempoMedioPrimeiraCompraDias: tempoMedio,
    agencias: linhas.map((l) => l.linha),
  };
}
