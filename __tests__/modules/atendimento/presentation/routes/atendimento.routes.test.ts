jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

const mockController = {
  listarConversas: jest.fn(),
  listarTemplatesAprovados: jest.fn(),
  listarTextosProntos: jest.fn(),
  criarTextoPronto: jest.fn(),
  marcarComoLida: jest.fn(),
  enviarMensagem: jest.fn(),
  assumirAtendimento: jest.fn(),
  sincronizarTemplates: jest.fn(),
  obterArquivoMidia: jest.fn(),
};

// jest.mock é hoisted acima da declaração de mockController — referenciar o
// objeto direto causaria "Cannot access before initialization". Envolvendo
// cada chamada numa arrow function, a referência só é resolvida quando o
// teste efetivamente chama a rota (depois que o módulo já inicializou).
jest.mock("@/modules/atendimento/presentation/controllers/atendimento.controller", () => ({
  atendimentoController: {
    listarConversas: (...args: unknown[]) => mockController.listarConversas(...args),
    listarTemplatesAprovados: (...args: unknown[]) =>
      mockController.listarTemplatesAprovados(...args),
    listarTextosProntos: (...args: unknown[]) => mockController.listarTextosProntos(...args),
    criarTextoPronto: (...args: unknown[]) => mockController.criarTextoPronto(...args),
    marcarComoLida: (...args: unknown[]) => mockController.marcarComoLida(...args),
    enviarMensagem: (...args: unknown[]) => mockController.enviarMensagem(...args),
    assumirAtendimento: (...args: unknown[]) => mockController.assumirAtendimento(...args),
    sincronizarTemplates: (...args: unknown[]) => mockController.sincronizarTemplates(...args),
    obterArquivoMidia: (...args: unknown[]) => mockController.obterArquivoMidia(...args),
  },
}));

import { getServerSession } from "next-auth";
import { ConflictError, NotFoundError, RateLimitError } from "@/modules/shared/domain/errors";
import { ForaDaJanela24hError } from "@/modules/atendimento/domain/errors";
import {
  assumirAtendimentoRoute,
  criarTextoProntoRoute,
  enviarMensagemRoute,
  listarConversasRoute,
  listarTemplatesAprovadosRoute,
  listarTextosProntosRoute,
  marcarComoLidaRoute,
  obterArquivoMidiaRoute,
  sincronizarTemplatesRoute,
} from "@/modules/atendimento/presentation/routes/atendimento.routes";

function sessionComoUsuario(id: string | null) {
  (getServerSession as jest.Mock).mockResolvedValue(id ? { user: { id } } : null);
}

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/atendimento", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("atendimento.routes — autenticação", () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ["listarConversasRoute", () => listarConversasRoute(new Request("http://localhost"))],
    [
      "listarTemplatesAprovadosRoute",
      () => listarTemplatesAprovadosRoute(new Request("http://localhost")),
    ],
    ["listarTextosProntosRoute", () => listarTextosProntosRoute(new Request("http://localhost"))],
    ["sincronizarTemplatesRoute", () => sincronizarTemplatesRoute(new Request("http://localhost"))],
    ["marcarComoLidaRoute", () => marcarComoLidaRoute(new Request("http://localhost"), "conv-1")],
    [
      "assumirAtendimentoRoute",
      () => assumirAtendimentoRoute(new Request("http://localhost"), "conv-1"),
    ],
    [
      "obterArquivoMidiaRoute",
      () => obterArquivoMidiaRoute(new Request("http://localhost"), "midia-1"),
    ],
    [
      "enviarMensagemRoute",
      () => enviarMensagemRoute(jsonRequest({ tipo: "texto", conteudo: "oi" }), "conv-1"),
    ],
    [
      "criarTextoProntoRoute",
      () => criarTextoProntoRoute(jsonRequest({ titulo: "t", conteudo: "c" })),
    ],
  ])("%s responde 401 sem sessão", async (_nome, chamar) => {
    sessionComoUsuario(null);

    const response = await chamar();

    expect(response.status).toBe(401);
  });
});

describe("listarConversasRoute", () => {
  beforeEach(() => jest.clearAllMocks());

  it("devolve 200 com o que o controller retorna quando autenticado", async () => {
    sessionComoUsuario("analista-1");
    mockController.listarConversas.mockResolvedValue([{ id: "conv-1" }]);

    const response = await listarConversasRoute(new Request("http://localhost"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: "conv-1" }]);
  });
});

describe("criarTextoProntoRoute", () => {
  beforeEach(() => jest.clearAllMocks());

  it("responde 422 com body inválido (sem chamar o controller)", async () => {
    sessionComoUsuario("analista-txt-422");

    const response = await criarTextoProntoRoute(jsonRequest({ titulo: "" }));

    expect(response.status).toBe(422);
    expect(mockController.criarTextoPronto).not.toHaveBeenCalled();
  });

  it("cria com criadoPorId vindo da sessão (nunca do body)", async () => {
    sessionComoUsuario("analista-txt-201");
    mockController.criarTextoPronto.mockResolvedValue({ id: "txt-1", titulo: "t", conteudo: "c" });

    const response = await criarTextoProntoRoute(jsonRequest({ titulo: "t", conteudo: "c" }));

    expect(response.status).toBe(201);
    expect(mockController.criarTextoPronto).toHaveBeenCalledWith({
      titulo: "t",
      conteudo: "c",
      criadoPorId: "analista-txt-201",
    });
  });
});

describe("enviarMensagemRoute", () => {
  beforeEach(() => jest.clearAllMocks());

  it("responde 422 com body inválido", async () => {
    sessionComoUsuario("analista-msg-422");

    const response = await enviarMensagemRoute(
      jsonRequest({ tipo: "invalido", conteudo: "" }),
      "conv-1",
    );

    expect(response.status).toBe(422);
    expect(mockController.enviarMensagem).not.toHaveBeenCalled();
  });

  it("ignora analistaNome do body — usa sempre o analistaId da sessão", async () => {
    sessionComoUsuario("analista-real");
    mockController.enviarMensagem.mockResolvedValue({ id: "msg-1" });

    const response = await enviarMensagemRoute(
      jsonRequest({ tipo: "texto", conteudo: "oi", analistaNome: "Nome Forjado Pelo Cliente" }),
      "conv-1",
    );

    expect(response.status).toBe(201);
    expect(mockController.enviarMensagem).toHaveBeenCalledWith({
      conversaId: "conv-1",
      analistaId: "analista-real",
      tipo: "texto",
      conteudo: "oi",
    });
  });

  it.each([
    [new NotFoundError("Conversa"), 404],
    [new ConflictError("conflito"), 409],
    [new ForaDaJanela24hError(), 409],
    [new RateLimitError(), 429],
    [new Error("erro genérico"), 500],
  ])("mapeia %p pro status %i", async (erro, statusEsperado) => {
    sessionComoUsuario(`analista-erro-${statusEsperado}`);
    mockController.enviarMensagem.mockRejectedValue(erro);

    const response = await enviarMensagemRoute(
      jsonRequest({ tipo: "texto", conteudo: "oi" }),
      "conv-1",
    );

    expect(response.status).toBe(statusEsperado);
  });

  it("responde 429 depois de estourar o limite de escrita por analista (60 por minuto)", async () => {
    sessionComoUsuario("analista-rate-limit");
    mockController.enviarMensagem.mockResolvedValue({ id: "msg-1" });

    let ultimaResposta;
    for (let i = 0; i < 61; i += 1) {
      ultimaResposta = await enviarMensagemRoute(
        jsonRequest({ tipo: "texto", conteudo: "oi" }),
        "conv-1",
      );
    }

    expect(ultimaResposta?.status).toBe(429);
    expect(mockController.enviarMensagem).toHaveBeenCalledTimes(60);
  });
});

describe("assumirAtendimentoRoute", () => {
  beforeEach(() => jest.clearAllMocks());

  it("delega conversaId + analistaId da sessão pro controller", async () => {
    sessionComoUsuario("analista-assumir");
    mockController.assumirAtendimento.mockResolvedValue({ id: "conv-1" });

    const response = await assumirAtendimentoRoute(
      new Request("http://localhost", { method: "POST" }),
      "conv-1",
    );

    expect(response.status).toBe(200);
    expect(mockController.assumirAtendimento).toHaveBeenCalledWith({
      conversaId: "conv-1",
      analistaId: "analista-assumir",
    });
  });

  it("mapeia ConflictError (outro analista dentro da janela) pra 409", async () => {
    sessionComoUsuario("analista-assumir-conflito");
    mockController.assumirAtendimento.mockRejectedValue(new ConflictError("já em atendimento"));

    const response = await assumirAtendimentoRoute(
      new Request("http://localhost", { method: "POST" }),
      "conv-1",
    );

    expect(response.status).toBe(409);
  });
});

describe("marcarComoLidaRoute", () => {
  beforeEach(() => jest.clearAllMocks());

  it("delega o conversaId pro controller e devolve 200", async () => {
    sessionComoUsuario("analista-marcar");
    mockController.marcarComoLida.mockResolvedValue({ id: "conv-1" });

    const response = await marcarComoLidaRoute(
      new Request("http://localhost", { method: "POST" }),
      "conv-1",
    );

    expect(response.status).toBe(200);
    expect(mockController.marcarComoLida).toHaveBeenCalledWith("conv-1");
  });
});

describe("obterArquivoMidiaRoute", () => {
  beforeEach(() => jest.clearAllMocks());

  it("redireciona quando o resultado é do tipo redirect", async () => {
    sessionComoUsuario("analista-midia");
    mockController.obterArquivoMidia.mockResolvedValue({
      resultado: { tipo: "redirect", url: "https://storage.example.com/signed" },
      fileName: "foto.jpg",
    });

    const response = await obterArquivoMidiaRoute(new Request("http://localhost"), "midia-1");

    expect(response.status).toBe(302);
  });

  it("devolve os bytes com o content-type certo quando o resultado é buffer", async () => {
    sessionComoUsuario("analista-midia-buffer");
    mockController.obterArquivoMidia.mockResolvedValue({
      resultado: { tipo: "buffer", buffer: Buffer.from("bytes"), mimeType: "image/jpeg" },
      fileName: "foto.jpg",
    });

    const response = await obterArquivoMidiaRoute(new Request("http://localhost"), "midia-1");

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    expect(response.headers.get("Content-Disposition")).toContain("foto.jpg");
  });

  it("mapeia NotFoundError pra 404", async () => {
    sessionComoUsuario("analista-midia-404");
    mockController.obterArquivoMidia.mockRejectedValue(new NotFoundError("Arquivo de mídia"));

    const response = await obterArquivoMidiaRoute(
      new Request("http://localhost"),
      "midia-inexistente",
    );

    expect(response.status).toBe(404);
  });
});

describe("sincronizarTemplatesRoute", () => {
  beforeEach(() => jest.clearAllMocks());

  it("devolve a contagem de templates sincronizados", async () => {
    sessionComoUsuario("analista-sync");
    mockController.sincronizarTemplates.mockResolvedValue(3);

    const response = await sincronizarTemplatesRoute(
      new Request("http://localhost", { method: "POST" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ sincronizados: 3 });
  });
});
