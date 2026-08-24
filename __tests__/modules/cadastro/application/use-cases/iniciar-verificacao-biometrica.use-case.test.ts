import { IniciarVerificacaoBiometricaUseCase } from "@/modules/cadastro/application/use-cases/iniciar-verificacao-biometrica.use-case";
import type { BiometriaVerificacaoService } from "@/modules/cadastro/domain/services/biometria-verificacao-service";
import type { BiometriaVerificacaoRepository } from "@/modules/cadastro/domain/repositories/biometria-verificacao-repository";
import type { EmailSender } from "@/modules/shared/domain/services/email-sender";
import { BiometriaVerificacao } from "@/modules/cadastro/domain/entities/biometria-verificacao.entity";

function servicoFake(
  overrides: Partial<BiometriaVerificacaoService> = {},
): BiometriaVerificacaoService {
  return {
    iniciarVerificacao: jest.fn().mockResolvedValue({
      url: "https://widget.legitimuz.com/session-1",
      urlQrCode: "https://widget.legitimuz.com/session-1/qr-code",
      sessionId: "session-1",
      personId: "person-1",
    }),
    ...overrides,
  };
}

function repositorioFake(
  overrides: Partial<BiometriaVerificacaoRepository> = {},
): BiometriaVerificacaoRepository {
  return {
    criarOuSubstituir: jest.fn().mockImplementation((input) =>
      Promise.resolve(
        BiometriaVerificacao.create({
          id: "biometria-1",
          ...input,
          status: "pendente",
          tentativasLembrete: 0,
          linkEnviadoEm: new Date(),
          resolvidoEm: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
    ),
    buscarPorToken: jest.fn(),
    buscarPorContratoIdEEmail: jest.fn(),
    findByContratoId: jest.fn(),
    atualizarStatus: jest.fn(),
    incrementarTentativasLembrete: jest.fn(),
    ...overrides,
  };
}

function emailSenderFake(overrides: Partial<EmailSender> = {}): EmailSender {
  return { send: jest.fn(), ...overrides };
}

describe("IniciarVerificacaoBiometricaUseCase", () => {
  it("inicia a verificação na Legitimuz com o token como ref_id, persiste e manda e-mail com o link", async () => {
    const service = servicoFake();
    const repository = repositorioFake();
    const emailSender = emailSenderFake();
    const useCase = new IniciarVerificacaoBiometricaUseCase(service, repository, emailSender);

    await useCase.execute({
      contratoId: "ct-1",
      agenciaId: "ag-1",
      email: "fulano@teste.com",
      cpf: "39053344705",
      nome: "Fulano de Tal",
      baseUrl: "https://painel.sakuraclick.com.br",
    });

    expect(service.iniciarVerificacao).toHaveBeenCalledWith(
      expect.objectContaining({
        cpf: "39053344705",
        redirectUrl: expect.stringContaining(
          "https://painel.sakuraclick.com.br/cadastro/biometria/",
        ),
      }),
    );

    const [chamadaService] = (service.iniciarVerificacao as jest.Mock).mock.calls[0];
    const [chamadaRepo] = (repository.criarOuSubstituir as jest.Mock).mock.calls[0];
    // ref_id mandado pra Legitimuz precisa ser o MESMO token persistido —
    // é o que o webhook usa pra achar a verificação de volta.
    expect(chamadaService.refId).toBe(chamadaRepo.token);
    expect(chamadaRepo).toEqual(
      expect.objectContaining({
        contratoId: "ct-1",
        agenciaId: "ag-1",
        email: "fulano@teste.com",
        cpf: "39053344705",
        sessionId: "session-1",
        personId: "person-1",
        legitimuzUrl: "https://widget.legitimuz.com/session-1",
        legitimuzUrlQrCode: "https://widget.legitimuz.com/session-1/qr-code",
      }),
    );

    expect(emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "fulano@teste.com",
        html: expect.stringContaining(chamadaRepo.token),
      }),
    );
  });
});
