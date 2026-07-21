import type {
  QsaConsultaService,
  QsaResult,
} from "@/modules/cadastro/domain/services/qsa-consulta-service";

const NOMES_MOCK = ["Ana Paula Ferreira", "Bruno Costa Lima", "Carla Menezes Rocha"];
const NATUREZAS_MOCK = ["Sociedade Empresária Limitada", "Empresário Individual"];
const PORTES_MOCK = ["Microempresa", "Empresa de Pequeno Porte", "Demais"];

// Sem integração real com a Receita Federal. Gera um resultado
// determinístico a partir do CNPJ, só pra o fluxo ponta a ponta (front +
// validação de sócios) funcionar quando RECEITAWS_API_TOKEN não está
// configurada. A integração real (ReceitaWsQsaConsultaAdapter, mesma
// pasta) já está pronta e ativa no composition root quando a env existir.
export class MockQsaConsultaService implements QsaConsultaService {
  async consultar(cnpj: string): Promise<QsaResult | null> {
    const seed = this.seedFromCnpj(cnpj);
    const quantidadeSocios = (seed % NOMES_MOCK.length) + 1;

    const ano = 2000 + (seed % 24);
    const mes = (seed % 12) + 1;
    const dia = (seed % 28) + 1;

    const optanteSimples = seed % 2 === 0;

    return {
      cnpj,
      razaoSocial: `Agência ${cnpj.slice(0, 8)} Ltda`,
      cnaeCompativel: true,
      socios: NOMES_MOCK.slice(0, quantidadeSocios).map((nome) => ({ nome })),
      dataAbertura: `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`,
      telefoneReceita: `(11) 3${String(1000 + (seed % 9000)).padStart(4, "0")}-${String(1000 + ((seed * 7) % 9000)).padStart(4, "0")}`,
      emailReceita: `contato@empresa${cnpj.slice(0, 4)}.com.br`,
      situacaoCadastral: "ATIVA",
      naturezaJuridica: NATUREZAS_MOCK[seed % NATUREZAS_MOCK.length]!,
      porte: PORTES_MOCK[seed % PORTES_MOCK.length]!,
      capitalSocial: (seed % 500) * 1000,
      optanteSimples,
      dataOpcaoSimples: optanteSimples ? `01/01/${2000 + (seed % 24)}` : null,
      endereco: {
        logradouro: `Rua Mock ${seed % 100}`,
        numero: String((seed % 999) + 1),
        complemento: null,
        bairro: "Centro",
        cidade: "São Paulo",
        uf: "SP",
        cep: `0${String(1000000 + (seed % 8999999)).slice(0, 7)}`,
      },
      cnaes: [
        { codigo: "7911-2/00", descricao: "Agências de viagens", principal: true },
        {
          codigo: "7912-1/00",
          descricao: "Operadores turísticos",
          principal: false,
        },
      ],
    };
  }

  private seedFromCnpj(cnpj: string): number {
    return cnpj.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  }
}
