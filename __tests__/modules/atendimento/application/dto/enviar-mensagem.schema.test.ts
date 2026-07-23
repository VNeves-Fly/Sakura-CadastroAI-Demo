import { enviarMensagemSchema } from "@/modules/atendimento/application/dto/enviar-mensagem.schema";

describe("enviarMensagemSchema", () => {
  it("aceita uma mensagem de texto válida", () => {
    const resultado = enviarMensagemSchema.safeParse({ tipo: "texto", conteudo: "Olá!" });
    expect(resultado.success).toBe(true);
  });

  it("aceita áudio com duracaoSegundos", () => {
    const resultado = enviarMensagemSchema.safeParse({
      tipo: "audio",
      conteudo: "audio.ogg",
      duracaoSegundos: 12,
    });
    expect(resultado.success).toBe(true);
  });

  it("aceita pdf com tamanhoArquivo", () => {
    const resultado = enviarMensagemSchema.safeParse({
      tipo: "pdf",
      conteudo: "arquivo.pdf",
      tamanhoArquivo: "1.2 MB",
    });
    expect(resultado.success).toBe(true);
  });

  it("rejeita tipo desconhecido", () => {
    const resultado = enviarMensagemSchema.safeParse({ tipo: "video", conteudo: "x" });
    expect(resultado.success).toBe(false);
  });

  it("rejeita conteudo vazio", () => {
    const resultado = enviarMensagemSchema.safeParse({ tipo: "texto", conteudo: "" });
    expect(resultado.success).toBe(false);
  });

  it("rejeita duracaoSegundos negativa ou zero", () => {
    expect(
      enviarMensagemSchema.safeParse({ tipo: "audio", conteudo: "x", duracaoSegundos: 0 }).success,
    ).toBe(false);
    expect(
      enviarMensagemSchema.safeParse({ tipo: "audio", conteudo: "x", duracaoSegundos: -5 }).success,
    ).toBe(false);
  });

  it("rejeita quando falta o campo tipo ou conteudo", () => {
    expect(enviarMensagemSchema.safeParse({ conteudo: "x" }).success).toBe(false);
    expect(enviarMensagemSchema.safeParse({ tipo: "texto" }).success).toBe(false);
  });
});
