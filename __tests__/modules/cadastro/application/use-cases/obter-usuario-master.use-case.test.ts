import { ObterUsuarioMasterUseCase } from "@/modules/cadastro/application/use-cases/obter-usuario-master.use-case";
import { UsuarioMaster } from "@/modules/cadastro/domain/entities/usuario-master.entity";
import type { UsuarioMasterRepository } from "@/modules/cadastro/domain/repositories/usuario-master-repository";

function criarRepositorio(resultado: UsuarioMaster | null): UsuarioMasterRepository {
  return {
    findByAgenciaId: jest.fn().mockResolvedValue(resultado),
    salvar: jest.fn(),
  };
}

describe("ObterUsuarioMasterUseCase", () => {
  it("devolve o Usuário Master quando já foi salvo pra essa agência", async () => {
    const usuarioMaster = UsuarioMaster.create({
      id: "um-1",
      agenciaId: "agencia-1",
      nome: "Fulano de Tal",
      email: "fulano@teste.com",
      cpf: "11144477735",
      telefone: "11999998888",
      rg: "12.345.678-9",
      rgOrgaoEmissor: "SSP",
      rgUf: "SP",
      dataNascimento: new Date("1990-05-15T00:00:00Z"),
      origemRepresentanteLegalId: "socio-1",
      ativo: true,
      salvoPor: "analista@sakura.com",
      salvoEm: new Date("2026-01-01T00:00:00Z"),
      criadoEm: new Date("2026-01-01T00:00:00Z"),
    });
    const useCase = new ObterUsuarioMasterUseCase(criarRepositorio(usuarioMaster));

    const resultado = await useCase.execute("agencia-1");

    expect(resultado).toBe(usuarioMaster);
  });

  it("devolve null (não é erro) quando a agência ainda não tem Usuário Master salvo", async () => {
    const useCase = new ObterUsuarioMasterUseCase(criarRepositorio(null));

    const resultado = await useCase.execute("agencia-sem-usuario-master");

    expect(resultado).toBeNull();
  });
});
