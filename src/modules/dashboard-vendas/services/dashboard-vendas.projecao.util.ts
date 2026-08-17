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
  datasMantidas: string[];
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
    datasMantidas: mantidas.map((amostra) => amostra.data),
  };
}

// Curva horária — construída a partir do formato (não do valor) das
// vendas hora a hora dos mesmos 3 dias mantidos em `calcularProjecaoDoDia`
// (endpoint de detalhe não classifica Nacional/Internacional por bilhete,
// por isso a curva é só total, sem split de canal — decisão confirmada
// pelo PO).

export interface AmostraHoraria {
  data: string;
  totaisPorHora: number[]; // length 24, tarifa somada por hora (created_at)
}

const HORAS_DO_DIA = 24;

// Fração média (0-1) de vendas por hora, através dos dias informados —
// cada dia contribui sua própria distribuição normalizada (soma 1), a
// média entre dias também soma 1.
export function calcularFormaHoraria(amostras: AmostraHoraria[]): number[] {
  const fracoesPorDia = amostras.map((amostra) => {
    const totalDia = amostra.totaisPorHora.reduce((acumulado, valor) => acumulado + valor, 0);
    return amostra.totaisPorHora.map((valor) => (totalDia > 0 ? valor / totalDia : 0));
  });

  return Array.from({ length: HORAS_DO_DIA }, (_, hora) =>
    media(fracoesPorDia.map((fracoes) => fracoes[hora]!)),
  );
}

export interface PontoCurva {
  hora: string;
  esperado: number;
  realizadoHoje: number | null;
}

// `formaMedia` deve somar ~1 (ver `calcularFormaHoraria`). `esperado` é
// cumulativo (fechamento esperado até aquela hora); `realizadoHoje` é
// cumulativo até `horaAtual`, reescalado pra bater exatamente com
// `realizado` (total já confirmado) na hora atual — depois disso, null
// (hora futura, ainda não aconteceu).
export function calcularCurvaHoraria(
  formaMedia: number[],
  fechamentoEsperado: number,
  realizado: number,
  horaAtual: number,
): PontoCurva[] {
  if (formaMedia.length !== HORAS_DO_DIA) {
    throw new Error(`calcularCurvaHoraria espera forma com ${HORAS_DO_DIA} horas`);
  }

  let acumulado = 0;
  const cumulativo = formaMedia.map((fracao) => {
    acumulado += fracao;
    return acumulado;
  });
  const cumulativoNaHoraAtual = cumulativo[horaAtual]!;

  return cumulativo.map((fracaoAcumulada, hora) => ({
    hora: `${hora.toString().padStart(2, "0")}:00`,
    esperado: fracaoAcumulada * fechamentoEsperado,
    realizadoHoje:
      hora <= horaAtual && cumulativoNaHoraAtual > 0
        ? (fracaoAcumulada / cumulativoNaHoraAtual) * realizado
        : hora <= horaAtual
          ? 0
          : null,
  }));
}
