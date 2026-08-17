import {
  calcularProjecaoDoDia,
  type AmostraDia,
} from "@/modules/dashboard-vendas/services/dashboard-vendas.projecao.util";

describe("calcularProjecaoDoDia", () => {
  it("descarta a amostra de menor total e projeta com a média dos 3 restantes", () => {
    const amostras: AmostraDia[] = [
      { data: "d1", total: 1_200_000, nacional: 900_000, internacional: 300_000 },
      { data: "d2", total: 2_500_000, nacional: 1_800_000, internacional: 700_000 },
      { data: "d3", total: 900_000, nacional: 700_000, internacional: 200_000 },
      { data: "d4", total: 1_600_000, nacional: 1_100_000, internacional: 500_000 },
    ];

    const resultado = calcularProjecaoDoDia(amostras);

    // 900_000 (d3) é o menor — descartado. Média dos 3 restantes:
    // (1_200_000 + 2_500_000 + 1_600_000) / 3 = 1_766_666,67
    expect(resultado.fechamentoEsperado).toBeCloseTo(1_766_666.666_666_67);
  });

  it("calcula faixaMin/faixaMax como média ± desvio padrão amostral (n-1) dos 3 mantidos", () => {
    const amostras: AmostraDia[] = [
      { data: "d1", total: 150_000, nacional: 100_000, internacional: 50_000 },
      { data: "d2", total: 130_000, nacional: 90_000, internacional: 40_000 },
      { data: "d3", total: 165_000, nacional: 110_000, internacional: 55_000 },
      { data: "d4", total: 140_000, nacional: 95_000, internacional: 45_000 },
    ];

    const resultado = calcularProjecaoDoDia(amostras);

    // d2 (130_000) descartada. Mantidos: 150_000, 165_000, 140_000.
    // média = 151_666,67; desvio padrão amostral (÷2) ≈ 12_583,057
    const media = 151_666.666_666_666_66;
    const desvio = 12_583.057_392_117_92;
    expect(resultado.fechamentoEsperado).toBeCloseTo(media);
    expect(resultado.faixaMin).toBeCloseTo(media - desvio);
    expect(resultado.faixaMax).toBeCloseTo(media + desvio);
  });

  it("usa as MESMAS 3 datas escolhidas pelo total pra projetar nacional/internacional", () => {
    // d2 tem o maior valor nacional isolado, mas o MENOR total — precisa
    // ser descartada de nacional/internacional também, não só do total.
    const amostras: AmostraDia[] = [
      { data: "d1", total: 150_000, nacional: 50_000, internacional: 100_000 },
      { data: "d2", total: 100_000, nacional: 90_000, internacional: 10_000 },
      { data: "d3", total: 160_000, nacional: 60_000, internacional: 100_000 },
      { data: "d4", total: 155_000, nacional: 55_000, internacional: 100_000 },
    ];

    const resultado = calcularProjecaoDoDia(amostras);

    expect(resultado.nacionalProjecao).toBeCloseTo((50_000 + 60_000 + 55_000) / 3);
    expect(resultado.internacionalProjecao).toBeCloseTo((100_000 + 100_000 + 100_000) / 3);
  });

  it("lança erro se não receber exatamente 4 amostras", () => {
    const amostras: AmostraDia[] = [
      { data: "d1", total: 100, nacional: 60, internacional: 40 },
      { data: "d2", total: 200, nacional: 120, internacional: 80 },
      { data: "d3", total: 300, nacional: 180, internacional: 120 },
    ];

    expect(() => calcularProjecaoDoDia(amostras)).toThrow();
  });
});
