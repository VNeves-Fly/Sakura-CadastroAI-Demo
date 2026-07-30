import { ListarConversasUseCase } from "@/modules/atendimento/application/use-cases/listar-conversas.use-case";
import {
  fakeConversa,
  fakeConversaRepository,
  fakeResumoFichaClienteRepository,
} from "../../fixtures";

describe("ListarConversasUseCase", () => {
  it("sobrescreve o resumoFicha com o real da agência quando agenciaId existe", async () => {
    const conversaRepository = fakeConversaRepository({
      findAll: jest.fn().mockResolvedValue([fakeConversa({ agenciaId: "ag-1" })]),
    });
    const resumoFichaClienteRepository = fakeResumoFichaClienteRepository({
      obterResumo: jest.fn().mockResolvedValue({
        statusAgencia: "ativo",
        documentosAprovados: 5,
        documentosPendentes: 1,
        situacaoCadastralReceita: "ATIVA",
        contratoStatus: "assinado",
        amatSofiaConsultado: true,
      }),
    });
    const useCase = new ListarConversasUseCase(conversaRepository, resumoFichaClienteRepository);

    const resultado = await useCase.execute();
    const conversa = resultado[0]!;

    expect(resumoFichaClienteRepository.obterResumo).toHaveBeenCalledWith("ag-1");
    expect(conversa.resumoFicha.statusAgencia).toBe("ativo");
    expect(conversa.resumoFicha.documentosAprovados).toBe(5);
  });

  it("usa o placeholder pra conversas não identificadas, sem chamar o repositório de ficha", async () => {
    const conversaRepository = fakeConversaRepository({
      findAll: jest
        .fn()
        .mockResolvedValue([fakeConversa({ agenciaId: null, tipoContato: "nao_identificado" })]),
    });
    const resumoFichaClienteRepository = fakeResumoFichaClienteRepository();
    const useCase = new ListarConversasUseCase(conversaRepository, resumoFichaClienteRepository);

    const resultado = await useCase.execute();
    const conversa = resultado[0]!;

    expect(resumoFichaClienteRepository.obterResumo).not.toHaveBeenCalled();
    expect(conversa.resumoFicha).toEqual({
      statusAgencia: "em_andamento",
      documentosAprovados: 0,
      documentosPendentes: 0,
      documentosParaRevisar: [],
      situacaoCadastralReceita: null,
      contratoStatus: null,
      amatSofiaConsultado: false,
    });
  });

  it("devolve lista vazia sem chamar o repositório de ficha", async () => {
    const conversaRepository = fakeConversaRepository({ findAll: jest.fn().mockResolvedValue([]) });
    const resumoFichaClienteRepository = fakeResumoFichaClienteRepository();
    const useCase = new ListarConversasUseCase(conversaRepository, resumoFichaClienteRepository);

    const resultado = await useCase.execute();

    expect(resultado).toEqual([]);
    expect(resumoFichaClienteRepository.obterResumo).not.toHaveBeenCalled();
  });
});
