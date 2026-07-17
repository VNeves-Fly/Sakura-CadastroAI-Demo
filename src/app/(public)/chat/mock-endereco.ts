const LOGRADOUROS_MOCK = [
  "Avenida Paulista",
  "Rua das Flores",
  "Avenida Brigadeiro Faria Lima",
  "Rua Augusta",
  "Alameda Santos",
];

const BAIRROS_MOCK = ["Bela Vista", "Jardins", "Itaim Bibi", "Consolação", "Pinheiros"];

const CIDADES_UF_MOCK = [
  { cidade: "São Paulo", uf: "SP" },
  { cidade: "Rio de Janeiro", uf: "RJ" },
  { cidade: "Belo Horizonte", uf: "MG" },
  { cidade: "Curitiba", uf: "PR" },
];

export interface EnderecoMock {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

function seedFromCep(cepLimpo: string): number {
  return cepLimpo.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

// Sem chamada real a ViaCEP (protótipo isolado do backend) — resolve um
// endereço fake, mas determinístico, a partir do CEP digitado.
export function resolverEnderecoMock(cepLimpo: string): EnderecoMock {
  const seed = seedFromCep(cepLimpo);
  const cidadeUf = CIDADES_UF_MOCK[seed % CIDADES_UF_MOCK.length]!;

  return {
    logradouro: LOGRADOUROS_MOCK[seed % LOGRADOUROS_MOCK.length]!,
    bairro: BAIRROS_MOCK[seed % BAIRROS_MOCK.length]!,
    cidade: cidadeUf.cidade,
    uf: cidadeUf.uf,
  };
}
