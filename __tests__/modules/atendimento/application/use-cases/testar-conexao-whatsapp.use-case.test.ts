import { TestarConexaoWhatsappUseCase } from "@/modules/atendimento/application/use-cases/testar-conexao-whatsapp.use-case";
import { fakeWhatsAppMessagingService } from "../../fixtures";

describe("TestarConexaoWhatsappUseCase", () => {
  it("devolve sucesso com o número/nome verificado quando a chamada à Meta funciona", async () => {
    const whatsAppMessagingService = fakeWhatsAppMessagingService({
      verificarCredenciais: jest.fn().mockResolvedValue({
        displayPhoneNumber: "+55 11 99999-9999",
        verifiedName: "Sakura Travel",
      }),
    });
    const useCase = new TestarConexaoWhatsappUseCase(whatsAppMessagingService);

    const resultado = await useCase.execute();

    expect(resultado.sucesso).toBe(true);
    expect(resultado.mensagem).toContain("+55 11 99999-9999");
    expect(resultado.mensagem).toContain("Sakura Travel");
  });

  it("devolve sucesso: false com a mensagem de erro quando a chamada falha", async () => {
    const whatsAppMessagingService = fakeWhatsAppMessagingService({
      verificarCredenciais: jest
        .fn()
        .mockRejectedValue(new Error("WHATSAPP_ACCESS_TOKEN não configurada")),
    });
    const useCase = new TestarConexaoWhatsappUseCase(whatsAppMessagingService);

    const resultado = await useCase.execute();

    expect(resultado).toEqual({
      sucesso: false,
      mensagem: "WHATSAPP_ACCESS_TOKEN não configurada",
    });
  });

  it("usa mensagem genérica quando o erro capturado não é um Error", async () => {
    const whatsAppMessagingService = fakeWhatsAppMessagingService({
      verificarCredenciais: jest.fn().mockRejectedValue("string qualquer"),
    });
    const useCase = new TestarConexaoWhatsappUseCase(whatsAppMessagingService);

    const resultado = await useCase.execute();

    expect(resultado).toEqual({ sucesso: false, mensagem: "Falha ao conectar com a Meta." });
  });
});
