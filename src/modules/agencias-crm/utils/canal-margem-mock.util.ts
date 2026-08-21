// Mock puro de apresentação pra aba "Dashboard" do detalhe de Agência
// (SPEC_AGENCIAS_SAKURA seção 3.5) — NÃO faz parte do pipeline mock↔real
// do adapter principal (agencia-detalhe.adapter.ts). Margem/rentab. por
// canal (Aéreo/Terrestre) não têm fonte real hoje (mesma limitação já
// documentada em canal-resumo-mock.util.ts do módulo Executivo/Gestor);
// ficam isoladas aqui, só usando o hash determinístico da agência como
// seed, até o backend expor esse dado de verdade.

export interface CanalMargemAgencia {
  margemPct: number;
  margemLYPct: number;
  margemVariacaoPct: number;
  rentabLYPct: number; // % do valor do canal
  rentabLYVariacaoPct: number;
}

export function gerarMargemAereo(base: number): CanalMargemAgencia {
  const margemPct = Math.round((2.6 + ((base >> 3) % 25) / 10) * 100) / 100;
  const margemNegativa = (base >> 9) % 5 === 0;
  return {
    margemPct,
    margemLYPct: Math.round((margemPct - (0.2 + ((base >> 7) % 12) / 10)) * 100) / 100,
    margemVariacaoPct:
      (margemNegativa ? -1 : 1) * (Math.round((5 + ((base >> 9) % 250) / 10) * 100) / 100),
    rentabLYPct: Math.round((1.8 + ((base >> 11) % 60) / 10) * 100) / 100,
    rentabLYVariacaoPct: Math.round((15 + ((base >> 13) % 550) / 10) * 100) / 100,
  };
}

export function gerarMargemTerrestre(base: number): CanalMargemAgencia {
  const margemPct = Math.round((8 + ((base >> 4) % 60) / 10) * 100) / 100;
  const margemNegativa = base % 2 === 0;
  return {
    margemPct,
    margemLYPct: Math.round((margemPct + (1 + ((base >> 6) % 30) / 10)) * 100) / 100,
    margemVariacaoPct:
      (margemNegativa ? -1 : 1) * (Math.round((5 + ((base >> 8) % 220) / 10) * 100) / 100),
    rentabLYPct: Math.round((6 + ((base >> 10) % 90) / 10) * 100) / 100,
    rentabLYVariacaoPct: Math.round((2 + ((base >> 12) % 60) / 10) * 100) / 100,
  };
}

// Terrestre não tem split nacional/internacional real (é sempre um único
// tipo de serviço no domínio hoje) — mesma barra NAC/INT do Aéreo é
// reaproduzida aqui como mock só por fidelidade visual à SPEC ("sub-card
// Terrestre idêntico ao Aéreo"), mesma fórmula de
// gerarCanalTerrestre() do módulo Executivo.
export function gerarNacIntTerrestre(base: number): { nacPct: number; intPct: number } {
  const nacPct = Math.round((75 + ((base >> 2) % 20)) * 10) / 10;
  return { nacPct, intPct: Math.round((100 - nacPct) * 10) / 10 };
}

// Período do filtro "📅 Período" (mesmo controle do Dashboard CRM/
// Executivo, pedido do usuário 2026-08-21) aplicado ao card "Volume
// total" — "ano" é o mesmo `vendas.volumeTotalAno` que já existia (não
// muda o valor padrão exibido antes deste filtro existir); dia/ontem/mês
// são frações mock determinísticas do mesmo total anual.
export type PeriodoVolumeAgencia = "dia" | "ontem" | "mes" | "ano";

export interface VolumePeriodoAgencia {
  valor: number;
}

export function gerarVolumePorPeriodo(
  base: number,
  volumeAno: number,
): Record<PeriodoVolumeAgencia, VolumePeriodoAgencia> {
  const fracaoMes = 0.06 + ((base >> 4) % 8) / 100;
  const fracaoDia = 0.15 + ((base >> 6) % 10) / 1000;
  const fracaoOntem = 0.15 + ((base >> 8) % 10) / 1000;
  return {
    ano: { valor: volumeAno },
    mes: { valor: Math.round(volumeAno * fracaoMes) },
    dia: { valor: Math.round((volumeAno / 30) * fracaoDia * 10) },
    ontem: { valor: Math.round((volumeAno / 30) * fracaoOntem * 10) },
  };
}

// "Atualizado em DD/MM às HH:mm" (SPEC 3.5, linha 2 do card "Volume
// total") — mesmo padrão de canal-resumo-mock.util.ts do Executivo.
export function gerarAtualizadoEm(base: number): string {
  const minutosAtras = 5 + (base % 180);
  const data = new Date(Date.now() - minutosAtras * 60_000);
  const doisDigitos = (n: number) => String(n).padStart(2, "0");
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)} às ${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}
