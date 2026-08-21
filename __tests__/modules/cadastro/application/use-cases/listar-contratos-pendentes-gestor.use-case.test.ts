import { ListarContratosPendentesGestorUseCase } from "@/modules/cadastro/application/use-cases/listar-contratos-pendentes-gestor.use-case";
import type {
  ContratoAssinaturaRepository,
  ContratoPendenteGestor,
} from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";

describe("ListarContratosPendentesGestorUseCase", () => {
  it("delega pro repositório, por e-mail do gestor", async () => {
    const pendentes: ContratoPendenteGestor[] = [
      { contratoId: "ct-1", agenciaId: "ag-1", razaoSocial: "Empresa Teste Ltda" },
    ];
    const repository = {
      findPendentesPorEmail: jest.fn().mockResolvedValue(pendentes),
    } as unknown as ContratoAssinaturaRepository;
    const useCase = new ListarContratosPendentesGestorUseCase(repository);

    const resultado = await useCase.execute({ email: "cadastro@sakuratur.com.br" });

    expect(repository.findPendentesPorEmail).toHaveBeenCalledWith("cadastro@sakuratur.com.br");
    expect(resultado).toBe(pendentes);
  });
});
