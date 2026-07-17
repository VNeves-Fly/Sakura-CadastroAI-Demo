const NOMES_MOCK = [
  "Ana Paula Ferreira",
  "Bruno Costa Lima",
  "Carla Menezes Rocha",
  "Diego Andrade Souza",
];

export interface EmpresaMock {
  razaoSocial: string;
  socios: { nome: string }[];
}

function seedFromCnpj(cnpj: string): number {
  return cnpj.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

// Protótipo isolado do fluxo real (sem chamar adapters/services de
// verdade) — mesma ideia de semente determinística a partir do CNPJ que
// o MockQsaConsultaService usa, só pra dar consistência à demonstração
// (mesmo CNPJ sempre gera a mesma empresa/sócios).
export function gerarEmpresaMock(cnpjLimpo: string): EmpresaMock {
  const seed = seedFromCnpj(cnpjLimpo);
  const quantidadeSocios = (seed % NOMES_MOCK.length) + 1;

  return {
    razaoSocial: `Agência ${cnpjLimpo.slice(0, 8)} Ltda`,
    socios: NOMES_MOCK.slice(0, quantidadeSocios).map((nome) => ({ nome })),
  };
}

export function decisaoFinalMock(cnpjLimpo: string): "aprovado" | "manual" {
  return seedFromCnpj(cnpjLimpo) % 2 === 0 ? "aprovado" : "manual";
}
