import { ObterDadosReceitaUseCase } from "@/modules/cadastro/application/use-cases/obter-dados-receita.use-case";
import { DadosReceita } from "@/modules/cadastro/domain/entities/dados-receita.entity";
import type { DadosReceitaRepository } from "@/modules/cadastro/domain/repositories/dados-receita-repository";

function criarRepositorio(resultado: DadosReceita | null): DadosReceitaRepository {
  return {
    findByAgenciaId: jest.fn().mockResolvedValue(resultado),
    create: jest.fn(),
    update: jest.fn(),
  };
}

describe("ObterDadosReceitaUseCase", () => {
  it("devolve os Dados da Receita quando existem pra essa agência", async () => {
    const dadosReceita = DadosReceita.create({
      id: "dr-1",
      agenciaId: "agencia-1",
      situacaoCadastral: "ATIVA",
      dataAbertura: null,
      naturezaJuridica: null,
      porte: null,
      capitalSocial: null,
      telefone: null,
      email: null,
      optanteSimples: false,
      dataOpcaoSimples: null,
      endereco: null,
      cnaes: [],
      consultadoEm: new Date("2026-01-01T00:00:00Z"),
    });
    const useCase = new ObterDadosReceitaUseCase(criarRepositorio(dadosReceita));

    const resultado = await useCase.execute("agencia-1");

    expect(resultado).toBe(dadosReceita);
  });

  it("devolve null (não é erro) quando a agência não tem Dados da Receita — cadastro anterior a essa funcionalidade", async () => {
    const useCase = new ObterDadosReceitaUseCase(criarRepositorio(null));

    const resultado = await useCase.execute("agencia-antiga");

    expect(resultado).toBeNull();
  });
});
