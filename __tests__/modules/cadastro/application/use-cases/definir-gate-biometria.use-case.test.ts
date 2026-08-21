import { DefinirGateBiometriaUseCase } from "@/modules/cadastro/application/use-cases/definir-gate-biometria.use-case";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";

describe("DefinirGateBiometriaUseCase", () => {
  it("liga o gate de biometria pra agência informada", async () => {
    const agenciaAtualizada = { id: "ag-1", gateBiometriaAtivo: true } as unknown as Agencia;
    const agenciaRepository = {
      atualizarGateBiometria: jest.fn().mockResolvedValue(agenciaAtualizada),
    } as unknown as AgenciaRepository;
    const useCase = new DefinirGateBiometriaUseCase(agenciaRepository);

    const resultado = await useCase.execute({ agenciaId: "ag-1", ativo: true });

    expect(agenciaRepository.atualizarGateBiometria).toHaveBeenCalledWith("ag-1", true);
    expect(resultado).toBe(agenciaAtualizada);
  });

  it("desliga o gate de biometria", async () => {
    const agenciaRepository = {
      atualizarGateBiometria: jest.fn().mockResolvedValue({} as Agencia),
    } as unknown as AgenciaRepository;
    const useCase = new DefinirGateBiometriaUseCase(agenciaRepository);

    await useCase.execute({ agenciaId: "ag-1", ativo: false });

    expect(agenciaRepository.atualizarGateBiometria).toHaveBeenCalledWith("ag-1", false);
  });
});
