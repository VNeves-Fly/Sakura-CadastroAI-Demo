import { montarFilaAssinatura } from "@/modules/admin/adapters/dossie.adapter";
import type { RepresentanteLegalDetalhe } from "@/modules/cadastro/domain/repositories/agencia-repository";

const ENDERECO_VAZIO = {
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
};

function socioFake(overrides: Partial<RepresentanteLegalDetalhe> = {}): RepresentanteLegalDetalhe {
  return {
    id: "socio-1",
    nome: "Fulano de Tal",
    cpf: "12345678900",
    email: "fulano@example.com",
    telefone: "11999999999",
    estadoCivil: "solteiro",
    isRepresentanteLegal: false,
    endereco: ENDERECO_VAZIO,
    rg: null,
    procuracao: null,
    rgNumero: null,
    rgOrgaoEmissor: null,
    nacionalidade: null,
    dataNascimento: null,
    administrativo: null,
    ...overrides,
  };
}

describe("montarFilaAssinatura", () => {
  it("exclui da fila o sócio marcado administrativo=false, mas inclui administrativo=null/true", () => {
    const naoAssina = socioFake({
      id: "socio-2",
      nome: "Nao Assina",
      email: "naoassina@example.com",
      administrativo: false,
    });
    const assinaPorPadrao = socioFake({
      id: "socio-3",
      nome: "Assina Padrao",
      email: "assinapadrao@example.com",
      administrativo: null,
    });
    const assinaExplicito = socioFake({
      id: "socio-4",
      nome: "Assina Explicito",
      email: "assinaexplicito@example.com",
      administrativo: true,
    });

    const fila = montarFilaAssinatura(
      [socioFake(), naoAssina, assinaPorPadrao, assinaExplicito],
      [],
      null,
      new Set(),
      new Map(),
    );

    expect(fila.map((s) => s.nome)).toEqual(["Fulano de Tal", "Assina Padrao", "Assina Explicito"]);
  });
});
