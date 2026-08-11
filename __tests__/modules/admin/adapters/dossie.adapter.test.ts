import { montarFilaAssinatura } from "@/modules/admin/adapters/dossie.adapter";
import type { RepresentanteLegalDetalhe } from "@/modules/cadastro/domain/repositories/agencia-repository";
import { SignatarioPadrao } from "@/modules/cadastro/domain/entities/signatario-padrao.entity";

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

  function signatarioPadraoFake(
    overrides: Partial<Parameters<typeof SignatarioPadrao.create>[0]> = {},
  ): SignatarioPadrao {
    return SignatarioPadrao.create({
      id: "sig-1",
      nome: "Signatário",
      cargo: null,
      email: "sig@sakuratur.com.br",
      telefone: null,
      deletedAt: null,
      ordem: null,
      papel: "ASSINAR_COMO_PARTE",
      estagio: 1,
      ...overrides,
    });
  }

  it("ordena a fila da Sakura por estágio (fila real do D4Sign), não por `ordem`", () => {
    // `ordem` propositalmente ao contrário de `estagio` — confirma que o
    // sort usa estagio, não o campo aposentado (ver PR de drag-and-drop).
    const jean = signatarioPadraoFake({ id: "jean", nome: "Jean", estagio: 1, ordem: 99 });
    const vivi = signatarioPadraoFake({ id: "vivi", nome: "Vivi", estagio: 2, ordem: 1 });

    const fila = montarFilaAssinatura([], [vivi, jean], null, new Set(), new Map());

    expect(fila.map((s) => s.nome)).toEqual(["Jean", "Vivi"]);
  });

  it("propaga o keySigner de ContratoAssinatura pro item da fila", () => {
    const socio = socioFake({ email: "socio@example.com" });
    const jean = signatarioPadraoFake({ id: "jean", email: "cadastro@sakuratur.com.br" });

    const fila = montarFilaAssinatura(
      [socio],
      [jean],
      null,
      new Set(),
      new Map([
        ["socio@example.com", { assinadoEm: null, keySigner: "a2V5LXNvY2lv" }],
        ["cadastro@sakuratur.com.br", { assinadoEm: new Date(), keySigner: "a2V5LWplYW4=" }],
      ]),
    );

    expect(fila.find((s) => s.id === socio.id)?.keySigner).toBe("a2V5LXNvY2lv");
    expect(fila.find((s) => s.id === "jean")?.keySigner).toBe("a2V5LWplYW4=");
  });
});
