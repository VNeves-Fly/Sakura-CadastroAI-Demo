import { ListarConversasUseCase } from "@/modules/atendimento/application/use-cases/listar-conversas.use-case";
import {
  fakeConversa,
  fakeConversaRepository,
  fakeResumoFichaClienteRepository,
  fakeSolicitacaoTransferenciaRepository,
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
    const solicitacaoTransferenciaRepository = fakeSolicitacaoTransferenciaRepository();
    const useCase = new ListarConversasUseCase(
      conversaRepository,
      resumoFichaClienteRepository,
      solicitacaoTransferenciaRepository,
    );

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
    const solicitacaoTransferenciaRepository = fakeSolicitacaoTransferenciaRepository();
    const useCase = new ListarConversasUseCase(
      conversaRepository,
      resumoFichaClienteRepository,
      solicitacaoTransferenciaRepository,
    );

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

  it("sobrescreve solicitacaoTransferenciaPendente com o que o repositório devolve", async () => {
    const conversaRepository = fakeConversaRepository({
      findAll: jest.fn().mockResolvedValue([fakeConversa()]),
    });
    const resumoFichaClienteRepository = fakeResumoFichaClienteRepository();
    const solicitacaoTransferenciaRepository = fakeSolicitacaoTransferenciaRepository({
      findVisivelPorConversa: jest.fn().mockResolvedValue({
        id: "transf-1",
        conversaId: "conv-1",
        deAnalista: "Ana",
        paraAnalista: "Beto",
        status: "pendente",
        criadaEm: "2026-01-01T00:00:00.000Z",
      }),
    });
    const useCase = new ListarConversasUseCase(
      conversaRepository,
      resumoFichaClienteRepository,
      solicitacaoTransferenciaRepository,
    );

    const [conversa] = await useCase.execute();

    expect(solicitacaoTransferenciaRepository.findVisivelPorConversa).toHaveBeenCalledWith(
      "conv-1",
    );
    expect(conversa?.solicitacaoTransferenciaPendente?.status).toBe("pendente");
  });

  it("devolve lista vazia sem chamar o repositório de ficha", async () => {
    const conversaRepository = fakeConversaRepository({ findAll: jest.fn().mockResolvedValue([]) });
    const resumoFichaClienteRepository = fakeResumoFichaClienteRepository();
    const solicitacaoTransferenciaRepository = fakeSolicitacaoTransferenciaRepository();
    const useCase = new ListarConversasUseCase(
      conversaRepository,
      resumoFichaClienteRepository,
      solicitacaoTransferenciaRepository,
    );

    const resultado = await useCase.execute();

    expect(resultado).toEqual([]);
    expect(resumoFichaClienteRepository.obterResumo).not.toHaveBeenCalled();
  });
});
