// Núcleo puro do algoritmo de projeção — confirmado diretamente pelo PO
// (não é decisão de engenharia, ver docs/faltante.md e docs/crm-backend.md
// decisões #3 e #4): pega as últimas 4 ocorrências do mesmo dia da
// semana, descarta a de MENOR total, e projeta com média/desvio padrão
// amostral dos 3 restantes. O descarte é feito pelo TOTAL (não por
// canal) — nacional/internacional usam as mesmas 3 datas escolhidas.
// Zero I/O aqui de propósito, pra ser testável sem mock de rede.

export interface AmostraDia {
  data: string;
  total: number;
  nacional: number;
  internacional: number;
}

export interface ProjecaoCalculada {
  fechamentoEsperado: number;
  faixaMin: number;
  faixaMax: number;
  nacionalProjecao: number;
  internacionalProjecao: number;
}

function media(valores: number[]): number {
  return valores.reduce((acumulado, valor) => acumulado + valor, 0) / valores.length;
}

// Desvio padrão AMOSTRAL (divisor n-1) — com n=3 aqui, divide por 2.
function desvioPadraoAmostral(valores: number[]): number {
  const mediaValores = media(valores);
  const somaQuadrados = valores.reduce(
    (acumulado, valor) => acumulado + (valor - mediaValores) ** 2,
    0,
  );
  return Math.sqrt(somaQuadrados / (valores.length - 1));
}

export function calcularProjecaoDoDia(amostras: AmostraDia[]): ProjecaoCalculada {
  if (amostras.length !== 4) {
    throw new Error(
      `calcularProjecaoDoDia espera exatamente 4 amostras (mesmo dia da semana, últimas 4 semanas), recebeu ${amostras.length}`,
    );
  }

  const menor = amostras.reduce((a, b) => (a.total < b.total ? a : b));
  const mantidas = amostras.filter((amostra) => amostra !== menor);

  const totais = mantidas.map((amostra) => amostra.total);
  const fechamentoEsperado = media(totais);
  const desvio = desvioPadraoAmostral(totais);

  return {
    fechamentoEsperado,
    faixaMin: fechamentoEsperado - desvio,
    faixaMax: fechamentoEsperado + desvio,
    nacionalProjecao: media(mantidas.map((amostra) => amostra.nacional)),
    internacionalProjecao: media(mantidas.map((amostra) => amostra.internacional)),
  };
}
