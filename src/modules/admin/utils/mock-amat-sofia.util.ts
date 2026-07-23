// Mock 100% front-end das checagens AMAT (dívidas PEFIN/REFIN) e SOFIA
// (blacklist de reputação) — decisão explícita do usuário (2026-07-22):
// nenhuma das duas tem API/credencial real ainda, então o dado é gerado
// aqui mesmo, determinístico por CPF/CNPJ (mesma pessoa sempre cai no
// mesmo resultado), sem nenhuma chamada externa nem mudança no back-end.
// Quando existir integração de verdade, isso deve virar um adapter real
// no módulo `cadastro` (domain/service + infrastructure/adapter), seguindo
// o mesmo padrão do QSA/D4Sign — este arquivo inteiro seria substituído.

export type StatusSofia = "LIMPO" | "CONSTA";

export interface AmatDividaSocio {
  socioId: string;
  nome: string;
  pefin: number;
  refin: number;
}

export interface ConsultaAmat {
  socios: AmatDividaSocio[];
  dividaTotalAgencia: number;
}

export interface ConsultaSofiaSocio {
  socioId: string;
  nome: string;
  status: StatusSofia;
}

export interface ConsultaSofia {
  agenciaStatus: StatusSofia;
  socios: ConsultaSofiaSocio[];
}

export interface SocioParaConsulta {
  id: string;
  nome: string;
  cpf: string;
}

function hashNumerico(valor: string): number {
  const digitos = valor.replace(/\D/g, "");
  let hash = 0;
  for (const digito of digitos) {
    hash = (hash * 31 + Number(digito)) % 1_000_000;
  }
  return hash;
}

export async function consultarAmat(socios: SocioParaConsulta[]): Promise<ConsultaAmat> {
  const dividasPorSocio = socios.map((socio) => {
    const hash = hashNumerico(socio.cpf);
    const pefin = (hash % 5000) + (hash % 97);
    const refin = Math.floor((hash % 3000) / 2);
    return { socioId: socio.id, nome: socio.nome, pefin, refin };
  });

  const dividaTotalAgencia = dividasPorSocio.reduce(
    (soma, divida) => soma + divida.pefin + divida.refin,
    0,
  );

  return { socios: dividasPorSocio, dividaTotalAgencia };
}

export async function consultarSofia(
  cnpjAgencia: string,
  socios: SocioParaConsulta[],
): Promise<ConsultaSofia> {
  const statusPorHash = (valor: string): StatusSofia =>
    hashNumerico(valor) % 7 === 0 ? "CONSTA" : "LIMPO";

  return {
    agenciaStatus: statusPorHash(cnpjAgencia),
    socios: socios.map((socio) => ({
      socioId: socio.id,
      nome: socio.nome,
      status: statusPorHash(socio.cpf),
    })),
  };
}
