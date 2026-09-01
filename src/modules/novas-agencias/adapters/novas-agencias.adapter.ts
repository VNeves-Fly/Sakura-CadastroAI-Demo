import { maskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import type { IdentidadeAgenciaMock } from "@/modules/crm-mock/agencias.mock-data";
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

// Demo 100% mock (sem Prisma/SST): identidade + métricas de venda vêm
// inteiramente de IDENTIDADES_AGENCIAS_COMPARTILHADAS, o mesmo
// subconjunto usado por /crm/agencias — assim as duas telas convergem
// nos mesmos ids/nomes. Ver novas-agencias.loader.ts.

const UM_DIA_MS = 86_400_000;

// Fator fixo e determinístico só pra simular "base histórica de agências
// aprovadas" maior que a lista da janela — não é um dado real (não há
// SST/Postgres nesta demo), mas precisa ser plausível e estável.
const FATOR_BASE_APROVADAS = 3.4;

// nunca: sem venda no ano. comprando: já teve 1ª compra e segue vendendo
// no mês corrente. parou: já comprou alguma vez mas não vendeu no mês.
export function derivarSituacao(identidade: IdentidadeAgenciaMock): SituacaoAgenciaNova {
  if (identidade.vendasAno === 0) return "nunca";
  if (identidade.primeiraCompraEm && identidade.vendasMes > 0) return "comprando";
  return "parou";
}

interface LinhaInterna {
  linha: AgenciaNovaLinha;
  vendasAno: number;
  entradaEm: Date;
  primeiraCompraEm: Date | null;
}

function montarLinha(identidade: IdentidadeAgenciaMock): LinhaInterna {
  const situacao = derivarSituacao(identidade);

  return {
    linha: {
      id: identidade.id,
      nome: identidade.nome.toUpperCase(),
      meta: maskCnpj(identidade.cnpj),
      executivo: identidade.executivoNome ?? "não definido",
      gerente: identidade.gestorNome || "—",
      entrada: formatarDataBr(identidade.entradaEm),
      primeiraCompra: identidade.primeiraCompraEm
        ? formatarDataBr(identidade.primeiraCompraEm)
        : "—",
      volume: formatarMoedaBrl(identidade.vendasAno),
      situacao,
    },
    vendasAno: identidade.vendasAno,
    entradaEm: identidade.entradaEm,
    primeiraCompraEm: identidade.primeiraCompraEm,
  };
}

function diasEntre(inicio: Date, fim: Date): number {
  return Math.max(0, Math.round((fim.getTime() - inicio.getTime()) / UM_DIA_MS));
}

export function montarNovasAgenciasView(identidades: IdentidadeAgenciaMock[]): NovasAgenciasData {
  const linhas = identidades.map(montarLinha);

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

  const baseAprovadas = Math.round(total * FATOR_BASE_APROVADAS);

  return {
    funil: {
      novasAgencias: total,
      novasAgenciasPct: "100% da base",
      nuncaCompraram,
      nuncaCompraramPct: formatarPercentualDaBase(nuncaCompraram, total),
      comprando,
      comprandoPct: formatarPercentualDaBase(comprando, total),
      baseAprovadas,
    },
    volumeGerado: formatarMoedaAbreviada(volumeTotal),
    tempoMedioPrimeiraCompraDias: tempoMedio,
    agencias: linhas.map((l) => l.linha),
  };
}
