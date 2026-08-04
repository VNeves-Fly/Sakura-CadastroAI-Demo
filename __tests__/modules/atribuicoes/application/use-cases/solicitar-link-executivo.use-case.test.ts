import { SolicitarLinkExecutivoUseCase } from "@/modules/atribuicoes/application/use-cases/solicitar-link-executivo.use-case";
import { Promotor } from "@/modules/atribuicoes/domain/entities/promotor.entity";
import type { PromotorRepository } from "@/modules/atribuicoes/domain/repositories/promotor-repository";
import type { EmailSender } from "@/modules/shared/domain/services/email-sender";

const BASE_URL = "https://painel.sakuraclick.com.br";

function fakePromotor(): Promotor {
  return Promotor.create({
    id: "promotor-1",
    sica: 123,
    nome: "Ada Lovelace",
    gestorId: null,
    email: "ada@example.com",
    telefone: null,
    link: null,
    linkExecutivoId: [],
    bases: [],
    userId: null,
  });
}

function criarMocks(promotor: Promotor | null) {
  const promotorRepository: PromotorRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByLinkExecutivoId: jest.fn(),
    findByEmail: jest.fn().mockResolvedValue(promotor),
    findByUserId: jest.fn(),
    criar: jest.fn(),
    atualizar: jest.fn(),
  };

  const emailSender: EmailSender = { send: jest.fn().mockResolvedValue(undefined) };

  return { promotorRepository, emailSender };
}

describe("SolicitarLinkExecutivoUseCase", () => {
  it("retorna encontrado: false e não envia e-mail se o promotor não existe", async () => {
    const { promotorRepository, emailSender } = criarMocks(null);
    const useCase = new SolicitarLinkExecutivoUseCase(promotorRepository, emailSender);

    const resultado = await useCase.execute({ email: "naoexiste@example.com", baseUrl: BASE_URL });

    expect(resultado).toEqual({ encontrado: false });
    expect(emailSender.send).not.toHaveBeenCalled();
  });

  it("retorna encontrado: true e envia o e-mail com o link de cadastro do executivo", async () => {
    const promotor = fakePromotor();
    const { promotorRepository, emailSender } = criarMocks(promotor);
    const useCase = new SolicitarLinkExecutivoUseCase(promotorRepository, emailSender);

    const resultado = await useCase.execute({ email: promotor.email, baseUrl: BASE_URL });

    expect(resultado).toEqual({ encontrado: true });

    const [emailInput] = (emailSender.send as jest.Mock).mock.calls[0];
    expect(emailInput.to).toBe("ada@example.com");
    expect(emailInput.html).toContain(`${BASE_URL}/cadastro?executivo=promotor-1`);
  });

  it("não lança se o envio do e-mail falhar (best-effort) e ainda assim retorna encontrado: true", async () => {
    const promotor = fakePromotor();
    const { promotorRepository, emailSender } = criarMocks(promotor);
    (emailSender.send as jest.Mock).mockRejectedValue(new Error("falha no provedor"));
    const useCase = new SolicitarLinkExecutivoUseCase(promotorRepository, emailSender);

    await expect(useCase.execute({ email: promotor.email, baseUrl: BASE_URL })).resolves.toEqual({
      encontrado: true,
    });
  });
});
