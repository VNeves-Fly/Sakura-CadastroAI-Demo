import { cepAdapter } from "@/modules/cadastro/adapters/cep.adapter";

describe("cepAdapter.toBuscaCepInput", () => {
  it("remove a máscara antes de mandar pro service", () => {
    expect(cepAdapter.toBuscaCepInput("01310-100")).toBe("01310100");
  });
});

describe("cepAdapter.toEnderecoView", () => {
  it("mapeia a resposta da ViaCEP pro formato da view, preenchendo o que faltar com string vazia", () => {
    expect(
      cepAdapter.toEnderecoView({
        logradouro: "Avenida Paulista",
        bairro: "Bela Vista",
        localidade: "São Paulo",
        uf: "SP",
      }),
    ).toEqual({
      logradouro: "Avenida Paulista",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      uf: "SP",
    });
  });

  it("retorna null quando a ViaCEP sinaliza erro (CEP não existe)", () => {
    expect(cepAdapter.toEnderecoView({ erro: true })).toBeNull();
  });

  it("retorna null quando o service não retornou nada (ex: request falhou)", () => {
    expect(cepAdapter.toEnderecoView(null)).toBeNull();
  });

  it("preenche campos ausentes com string vazia em vez de undefined", () => {
    expect(cepAdapter.toEnderecoView({})).toEqual({
      logradouro: "",
      bairro: "",
      cidade: "",
      uf: "",
    });
  });
});
