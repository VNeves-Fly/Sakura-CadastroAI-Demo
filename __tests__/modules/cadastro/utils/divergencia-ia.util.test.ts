import { verificarDivergenciaCampo } from "@/modules/cadastro/utils/divergencia-ia.util";

describe("verificarDivergenciaCampo", () => {
  it("não sinaliza nada quando a IA não extraiu valor pro campo", () => {
    expect(verificarDivergenciaCampo("Nome", "Fulano", null)).toEqual({
      divergente: false,
      mensagem: null,
    });
  });

  it("não sinaliza nada quando o usuário ainda não digitou nada", () => {
    expect(verificarDivergenciaCampo("Nome", "", "Fulano de Tal")).toEqual({
      divergente: false,
      mensagem: null,
    });
  });

  it("não sinaliza divergência quando os valores só diferem em maiúsculas/espaço (normalização default)", () => {
    expect(verificarDivergenciaCampo("Nome", "  fulano de tal  ", "FULANO DE TAL")).toEqual({
      divergente: false,
      mensagem: null,
    });
  });

  it("sinaliza divergência quando o valor digitado é diferente do extraído pela IA", () => {
    const resultado = verificarDivergenciaCampo("Nome", "Beltrano", "Fulano de Tal");
    expect(resultado.divergente).toBe(true);
    expect(resultado.mensagem).toContain("Fulano de Tal");
  });

  it("aceita um normalizador customizado (ex: comparar CPF ignorando máscara)", () => {
    const semMascara = (valor: string) => valor.replace(/\D/g, "");
    const resultado = verificarDivergenciaCampo("CPF", "111.444.777-35", "11144477735", semMascara);
    expect(resultado.divergente).toBe(false);
  });
});
