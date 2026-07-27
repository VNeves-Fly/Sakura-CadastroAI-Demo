// Mock 100% front-end das checagens AMAT (dívidas PEFIN/REFIN) e SOFIA
// (blacklist de reputação) — decisão explícita do usuário (2026-07-22):
// nenhuma das duas tem API/credencial real ainda, então o dado é gerado
// aqui mesmo, determinístico por CPF/CNPJ (mesma pessoa sempre cai no
// mesmo resultado), sem nenhuma chamada externa nem mudança no back-end.
// Quando existir integração de verdade, isso deve virar um adapter real
// no módulo `cadastro` (domain/service + infrastructure/adapter), seguindo
// o mesmo padrão do QSA/D4Sign — este arquivo inteiro seria substituído.

export type StatusSofia = "LIMPO" | "CONSTA";

// Item individual de dívida (o pefin/refin do resumo é a soma destes) —
// pedido do usuário pra "ver mais que só o resumo" no modal "Ver tudo"
// (ver ConsultaAmatCard). Mockado pelo mesmo motivo do arquivo inteiro:
// nenhum credor/contrato real existe, só simula uma resposta plausível de
// consulta de dívidas.
export interface AmatOcorrenciaDivida {
  id: string;
  tipo: "PEFIN" | "REFIN";
  credor: string;
  contrato: string;
  valor: number;
  dataInclusao: Date;
}

export interface AmatDividaSocio {
  socioId: string;
  nome: string;
  pefin: number;
  refin: number;
  ocorrencias: AmatOcorrenciaDivida[];
}

export interface ConsultaAmat {
  socios: AmatDividaSocio[];
  dividaTotalAgencia: number;
}

// Ocorrência individual do SOFIA (fonte/motivo por trás do status CONSTA)
// — mesma ideia do AmatOcorrenciaDivida acima, só existe quando o status
// não é LIMPO.
export interface SofiaOcorrencia {
  id: string;
  fonte: string;
  motivo: string;
  dataInclusao: Date;
}

export interface ConsultaSofiaSocio {
  socioId: string;
  nome: string;
  status: StatusSofia;
  ocorrencias: SofiaOcorrencia[];
}

export interface ConsultaSofia {
  agenciaStatus: StatusSofia;
  agenciaOcorrencias: SofiaOcorrencia[];
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

const CREDORES_MOCK = [
  "Banco Alfa S.A.",
  "Financeira Beta Crédito",
  "Crediário Gama",
  "Banco Delta Consignado",
  "Fundo de Recebíveis Épsilon",
];

function gerarOcorrenciasDivida(
  socioId: string,
  hash: number,
  tipo: "PEFIN" | "REFIN",
  valorTotal: number,
): AmatOcorrenciaDivida[] {
  if (valorTotal <= 0) return [];

  const semente = tipo === "PEFIN" ? hash : hash * 7;
  const quantidade = (semente % 3) + 1;
  const pesos = Array.from(
    { length: quantidade },
    (_, indice) => ((semente + indice * 17) % 50) + 10,
  );
  const somaPesos = pesos.reduce((soma, peso) => soma + peso, 0);

  return pesos.map((peso, indice) => {
    const ultimoItem = indice === pesos.length - 1;
    const valorAcumulado = pesos
      .slice(0, indice)
      .reduce((soma, item) => soma + Math.round((valorTotal * item) / somaPesos), 0);
    const valor = ultimoItem
      ? valorTotal - valorAcumulado
      : Math.round((valorTotal * peso) / somaPesos);
    const diasAtras = ((semente + indice * 53) % 720) + 30;

    return {
      id: `${socioId}-${tipo}-${indice}`,
      tipo,
      credor: CREDORES_MOCK[(semente + indice * 7) % CREDORES_MOCK.length]!,
      contrato: `${tipo}-${((semente + indice * 97) % 900000) + 100000}`,
      valor,
      dataInclusao: new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000),
    };
  });
}

export async function consultarAmat(socios: SocioParaConsulta[]): Promise<ConsultaAmat> {
  const dividasPorSocio = socios.map((socio) => {
    const hash = hashNumerico(socio.cpf);
    const pefin = (hash % 5000) + (hash % 97);
    const refin = Math.floor((hash % 3000) / 2);
    const ocorrencias = [
      ...gerarOcorrenciasDivida(socio.id, hash, "PEFIN", pefin),
      ...gerarOcorrenciasDivida(socio.id, hash, "REFIN", refin),
    ];
    return { socioId: socio.id, nome: socio.nome, pefin, refin, ocorrencias };
  });

  const dividaTotalAgencia = dividasPorSocio.reduce(
    (soma, divida) => soma + divida.pefin + divida.refin,
    0,
  );

  return { socios: dividasPorSocio, dividaTotalAgencia };
}

const FONTES_SOFIA_MOCK = [
  "Cadastro Nacional de Devedores",
  "Base de Ocorrências Setorial",
  "Denúncia de Parceiro Comercial",
  "Auditoria Interna C2F",
];

const MOTIVOS_SOFIA_MOCK = [
  "Inadimplência recorrente",
  "Fraude documental identificada",
  "Reclamação formal de cliente",
  "Vínculo com empresa irregular",
  "Descumprimento contratual",
];

function gerarOcorrenciasSofia(id: string, hash: number, status: StatusSofia): SofiaOcorrencia[] {
  if (status === "LIMPO") return [];

  const quantidade = (hash % 2) + 1;
  return Array.from({ length: quantidade }, (_, indice) => {
    const diasAtras = ((hash + indice * 41) % 900) + 15;
    return {
      id: `${id}-sofia-${indice}`,
      fonte: FONTES_SOFIA_MOCK[(hash + indice * 3) % FONTES_SOFIA_MOCK.length]!,
      motivo: MOTIVOS_SOFIA_MOCK[(hash + indice * 11) % MOTIVOS_SOFIA_MOCK.length]!,
      dataInclusao: new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000),
    };
  });
}

export async function consultarSofia(
  cnpjAgencia: string,
  socios: SocioParaConsulta[],
): Promise<ConsultaSofia> {
  const statusPorHash = (valor: string): StatusSofia =>
    hashNumerico(valor) % 7 === 0 ? "CONSTA" : "LIMPO";

  const hashAgencia = hashNumerico(cnpjAgencia);
  const agenciaStatus = statusPorHash(cnpjAgencia);

  return {
    agenciaStatus,
    agenciaOcorrencias: gerarOcorrenciasSofia("agencia", hashAgencia, agenciaStatus),
    socios: socios.map((socio) => {
      const hash = hashNumerico(socio.cpf);
      const status = statusPorHash(socio.cpf);
      return {
        socioId: socio.id,
        nome: socio.nome,
        status,
        ocorrencias: gerarOcorrenciasSofia(socio.id, hash, status),
      };
    }),
  };
}
