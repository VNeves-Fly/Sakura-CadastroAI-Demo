import { ListarCadastrosUseCase } from "@/modules/cadastro/application/use-cases/listar-cadastros.use-case";
import {
  STATUS_EM_ANALISE,
  STATUS_EM_COMPLEMENTAR,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_ATIVO,
  STATUS_RECUSADO,
  type AgenciaRepository,
  type CadastrosKpis,
  type ListarCadastrosFiltros,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

const KPIS_VAZIOS: CadastrosKpis = {
  emAnalise: 0,
  emComplementar: 0,
  emComplementarPorInfoPendente: { emAberto: 0, infoPendente: 0 },
  aguardandoAssinatura: 0,
  aguardandoAssinaturaPorOrigem: { ia: 0, humano: 0 },
  aguardandoValidacao: 0,
  aguardandoCadastramento: 0,
  aguardandoAtivacao: 0,
  ativas: 0,
  recusadas: 0,
};

function repositorioFake(): AgenciaRepository & { listar: jest.Mock } {
  return {
    listar: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    obterKpis: jest.fn().mockResolvedValue(KPIS_VAZIOS),
  } as unknown as AgenciaRepository & { listar: jest.Mock };
}

describe("ListarCadastrosUseCase", () => {
  // Bug relatado pelo usuário (2026-07-27): sem nenhum status escolhido na
  // URL, uma agência "aguardando_assinatura" (fase de contrato) sumia da
  // listagem sem nenhum aviso — nenhum card de fila aparece "ativo" quando
  // não há status na querystring, então parecia estar mostrando tudo sem
  // realmente mostrar. Esclarecido pelo usuário na sequência: a regra é
  // "todo cadastro em andamento aparece, só os finalizados (ativo/
  // recusado) ficam de fora" — o default agora é todo status exceto os
  // dois finais.
  it("sem filtro de status explícito, usa o default com todo cadastro em andamento", async () => {
    const agenciaRepository = repositorioFake();
    const useCase = new ListarCadastrosUseCase(agenciaRepository);

    await useCase.execute({});

    const filtrosRecebidos = agenciaRepository.listar.mock.calls[0][0] as ListarCadastrosFiltros;
    expect(filtrosRecebidos.status).toEqual([
      STATUS_EM_ANALISE,
      STATUS_EM_COMPLEMENTAR,
      STATUS_AGUARDANDO_ASSINATURA,
      STATUS_AGUARDANDO_VALIDACAO,
      STATUS_AGUARDANDO_ATIVACAO,
    ]);
  });

  it("o default não inclui os estados finais (ativo/recusado)", async () => {
    const agenciaRepository = repositorioFake();
    const useCase = new ListarCadastrosUseCase(agenciaRepository);

    await useCase.execute({});

    const statusDefault = (agenciaRepository.listar.mock.calls[0][0] as ListarCadastrosFiltros)
      .status as string[];
    expect(statusDefault).not.toContain(STATUS_ATIVO);
    expect(statusDefault).not.toContain(STATUS_RECUSADO);
  });

  it("respeita o status explícito do filtro (clique numa fila), sem aplicar o default", async () => {
    const agenciaRepository = repositorioFake();
    const useCase = new ListarCadastrosUseCase(agenciaRepository);

    await useCase.execute({ status: STATUS_EM_ANALISE });

    const filtrosRecebidos = agenciaRepository.listar.mock.calls[0][0] as ListarCadastrosFiltros;
    expect(filtrosRecebidos.status).toBe(STATUS_EM_ANALISE);
  });
});
