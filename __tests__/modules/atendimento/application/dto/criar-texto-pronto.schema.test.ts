import { criarTextoProntoSchema } from "@/modules/atendimento/application/dto/criar-texto-pronto.schema";

describe("criarTextoProntoSchema", () => {
  it("aceita título e conteúdo preenchidos", () => {
    const resultado = criarTextoProntoSchema.safeParse({
      titulo: "Saudação",
      conteudo: "Olá, tudo bem?",
    });
    expect(resultado.success).toBe(true);
  });

  it("rejeita título vazio", () => {
    expect(criarTextoProntoSchema.safeParse({ titulo: "", conteudo: "x" }).success).toBe(false);
  });

  it("rejeita conteúdo vazio", () => {
    expect(criarTextoProntoSchema.safeParse({ titulo: "x", conteudo: "" }).success).toBe(false);
  });

  it("rejeita quando faltam os campos", () => {
    expect(criarTextoProntoSchema.safeParse({}).success).toBe(false);
  });
});
