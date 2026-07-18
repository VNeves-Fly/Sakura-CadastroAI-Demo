const NOMES_MOCK = [
  "Bruno Nascimento Bazoti",
  "Leandro Nascimento Lima",
  "Newton Junior",
  "Vinicius Neves",
];

const NOMES_AGENCIA_MOCK = [
  "Amo Viajar Turismo",
  "Destino Certo Viagens",
  "Bússola Turismo",
  "Voo Livre Turismo",
  "Mundo Aberto Viagens",
  "Horizonte Azul Viagens",
  "Passagem Livre Turismo",
  "Trilha Nova Turismo",
];

// Nomes no formato que a Receita gera pra MEI (número do CNPJ/CPF do
// titular na frente do nome) — usados só pra exercitar a limpeza em
// limparNomeSocial na demonstração.
const NOMES_MEI_MOCK = [
  "40284756000 MARIA JOSEFINA VIAGENS",
  "51192837000 CARLOS EDUARDO TURISMO",
  "62918374000 PATRICIA ALVES VIAGENS",
];

export interface EmpresaMock {
  razaoSocial: string;
  socios: { nome: string }[];
}

function seedFromCnpj(cnpj: string): number {
  return cnpj.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

// MEI geralmente tem o número do CNPJ/CPF do titular na frente do nome
// (formato gerado automaticamente pela Receita) — removemos esse
// prefixo antes de usar como "nome social" pra tratar o cliente.
export function limparNomeSocial(razaoSocial: string): string {
  const semPrefixo = razaoSocial.replace(/^\d+\s*/, "").trim();
  return semPrefixo.length > 0 ? semPrefixo : razaoSocial;
}

// Protótipo isolado do fluxo real (sem chamar adapters/services de
// verdade) — mesma ideia de semente determinística a partir do CNPJ que
// o MockQsaConsultaService usa, só pra dar consistência à demonstração
// (mesmo CNPJ sempre gera a mesma empresa/sócios).
export function gerarEmpresaMock(cnpjLimpo: string): EmpresaMock {
  const seed = seedFromCnpj(cnpjLimpo);
  const quantidadeSocios = (seed % NOMES_MOCK.length) + 1;
  const ehMei = seed % 5 === 0;
  const razaoSocial = ehMei
    ? NOMES_MEI_MOCK[seed % NOMES_MEI_MOCK.length]!
    : NOMES_AGENCIA_MOCK[seed % NOMES_AGENCIA_MOCK.length]!;

  return {
    razaoSocial,
    socios: NOMES_MOCK.slice(0, quantidadeSocios).map((nome) => ({ nome })),
  };
}

export function decisaoFinalMock(cnpjLimpo: string): "aprovado" | "manual" {
  return seedFromCnpj(cnpjLimpo) % 2 === 0 ? "aprovado" : "manual";
}
