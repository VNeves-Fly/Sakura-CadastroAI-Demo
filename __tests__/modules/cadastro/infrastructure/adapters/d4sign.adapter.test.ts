import { D4SignAdapter } from "@/modules/cadastro/infrastructure/adapters/d4sign.adapter";
import type { GerarContratoInput } from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import { SignatarioPadrao } from "@/modules/cadastro/domain/entities/signatario-padrao.entity";
import type { SignatarioPadraoRepository } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";

const originalEnv = process.env;

function fakeSignatarioPadraoRepository(
  signatarios: SignatarioPadrao[] = [],
): SignatarioPadraoRepository {
  return {
    findAll: async () => signatarios,
    findAtivos: async () => signatarios,
    findById: async () => {
      throw new Error("findById não implementado no fake de teste");
    },
    create: async () => {
      throw new Error("create não implementado no fake de teste");
    },
    update: async () => {
      throw new Error("update não implementado no fake de teste");
    },
    softDelete: async () => {
      throw new Error("softDelete não implementado no fake de teste");
    },
    restaurar: async () => {
      throw new Error("restaurar não implementado no fake de teste");
    },
  };
}

const JEAN = SignatarioPadrao.create({
  id: "sig-jean",
  nome: "Jean",
  cargo: "Time Cadastro",
  email: "cadastro@sakuratur.com.br",
  telefone: null,
  deletedAt: null,
  ordem: 1,
  papel: "APROVAR",
  estagio: 1,
});

const VIVI = SignatarioPadrao.create({
  id: "sig-vivi",
  nome: "Vivi Siqueira",
  cargo: "Sakura",
  email: "vivi.siqueira@sakuratur.com.br",
  telefone: null,
  deletedAt: null,
  ordem: 2,
  papel: "ASSINAR_COMO_PARTE",
  estagio: 2,
});

function setEnv(overrides: Record<string, string> = {}) {
  process.env = {
    ...originalEnv,
    D4SIGN_TOKEN_API: "token-teste",
    D4SIGN_CRYPT_KEY: "crypt-teste",
    D4SIGN_SAFE_UUID: "safe-uuid",
    D4SIGN_TEMPLATE_ID: "template-id",
    D4SIGN_API_BASE_URL: "https://api.teste.d4sign",
    ...overrides,
  };

  // originalEnv vem do .env real (next/jest carrega antes dos testes) — em
  // dev ele tem D4SIGN_WEBHOOK_URL de produção configurada, o que vazaria
  // uma chamada extra (registrarWebhook) pros testes que não esperam por
  // ela. Só fica definida quando o teste pedir via overrides.
  if (!overrides.D4SIGN_WEBHOOK_URL) {
    delete process.env.D4SIGN_WEBHOOK_URL;
  }
}

function okJson(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

const FULANO = {
  nome: "Fulano de Tal",
  email: "fulano@teste.com",
  cpf: "39053344705",
  rgNumero: "12345678",
  rgOrgaoEmissor: "SSP/SP",
  nacionalidade: "Brasileiro(a)",
  estadoCivil: "solteiro",
  dataNascimento: new Date("1990-01-01"),
  endereco: {
    logradouro: "Rua das Flores",
    numero: "50",
    complemento: "Apto 2",
    bairro: "Centro",
    cidade: "Campinas",
    uf: "SP",
    cep: "13010000",
  },
};

const CLAUSULA_FULANO =
  "FULANO DE TAL, BRASILEIRO(A), SOLTEIRO(A), REPRESENTANTE LEGAL, portador da Cédula de Identidade RG 12345678/SSP/SP inscrito no CPF/ME sob o n° 39053344705, residente e domiciliado na Cidade de Campinas, Estado de SP, Brasil, com residência na(o) Rua das Flores, N 50, Apto 2, Centro, CEP 13010000";

const input: GerarContratoInput = {
  cnpj: "19131243000197",
  razaoSocial: "Agência Teste",
  endereco: {
    logradouro: "Av Paulista",
    numero: "1000",
    complemento: "",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    uf: "SP",
    cep: "01310100",
  },
  signatarios: [FULANO],
};

describe("D4SignAdapter", () => {
  beforeEach(() => {
    setEnv();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("gera o documento a partir do template, cadastra o sócio no estágio 0 e envia pra assinatura, nessa ordem", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(okJson({ uuid: "doc-uuid-123" }))
      .mockResolvedValueOnce(okJson({}))
      .mockResolvedValueOnce(okJson({}));

    const resultado = await new D4SignAdapter(fakeSignatarioPadraoRepository()).gerarEEnviar(input);

    expect(resultado).toEqual({ provedorId: "doc-uuid-123", status: "aguardando_assinatura" });
    expect(global.fetch).toHaveBeenCalledTimes(3);

    const [criarUrl, criarOpts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(criarUrl).toBe(
      "https://api.teste.d4sign/documents/safe-uuid/makedocumentbytemplateword?tokenAPI=token-teste&cryptKey=crypt-teste",
    );
    expect(JSON.parse(criarOpts.body)).toEqual({
      name_document: "Contrato Sakura - Agência Teste - 19131243000197",
      templates: {
        "template-id": {
          razaosocial: "Agência Teste",
          cnpj: "19131243000197",
          cidade: "São Paulo",
          estado: "SP",
          endereco: "Av Paulista",
          n: "1000",
          complemento: "",
          bairro: "Bela Vista",
          cep: "01310100",
          indicacao: "indicado o representante legal da empresa",
          socios: CLAUSULA_FULANO,
        },
      },
    });

    const [listaUrl, listaOpts] = (global.fetch as jest.Mock).mock.calls[1];
    expect(listaUrl).toBe(
      "https://api.teste.d4sign/documents/doc-uuid-123/createlist?tokenAPI=token-teste&cryptKey=crypt-teste",
    );
    expect(JSON.parse(listaOpts.body)).toEqual({
      signers: [
        {
          email: "fulano@teste.com",
          act: "1",
          foreign: "0",
          certificadoicpbr: "0",
          assinatura_presencial: "0",
          after_position: "0",
          docauthandselfie: "1",
          videoselfie: "1",
        },
      ],
    });

    const [envioUrl, envioOpts] = (global.fetch as jest.Mock).mock.calls[2];
    expect(envioUrl).toBe(
      "https://api.teste.d4sign/documents/doc-uuid-123/sendtosigner?tokenAPI=token-teste&cryptKey=crypt-teste",
    );
    expect(JSON.parse(envioOpts.body)).toEqual({ skip_email: "0", workflow: "1" });
  });

  it("pluraliza a indicação e concatena as cláusulas com 'e' quando há mais de um signatário", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(okJson({ uuid: "doc-uuid-123" }))
      .mockResolvedValueOnce(okJson({}))
      .mockResolvedValueOnce(okJson({}));

    const CICRANA = {
      ...FULANO,
      nome: "Cicrana da Silva",
      email: "cicrana@teste.com",
      cpf: "98765432100",
    };

    await new D4SignAdapter(fakeSignatarioPadraoRepository()).gerarEEnviar({
      ...input,
      signatarios: [FULANO, CICRANA],
    });

    const [, criarOpts] = (global.fetch as jest.Mock).mock.calls[0];
    const { indicacao, socios } = JSON.parse(criarOpts.body).templates["template-id"];
    const clausulaCicrana = CLAUSULA_FULANO.replace("FULANO DE TAL", "CICRANA DA SILVA").replace(
      "39053344705",
      "98765432100",
    );
    expect(indicacao).toBe("indicados os representantes legais da empresa");
    expect(socios).toBe(`${CLAUSULA_FULANO} e ${clausulaCicrana}`);
  });

  it("omite RG e segmentos de endereço vazios na cláusula, sem deixar vírgula sobrando", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(okJson({ uuid: "doc-uuid-123" }))
      .mockResolvedValueOnce(okJson({}))
      .mockResolvedValueOnce(okJson({}));

    await new D4SignAdapter(fakeSignatarioPadraoRepository()).gerarEEnviar({
      ...input,
      signatarios: [
        {
          ...FULANO,
          rgNumero: null,
          rgOrgaoEmissor: null,
          endereco: { ...FULANO.endereco, complemento: "" },
        },
      ],
    });

    const [, criarOpts] = (global.fetch as jest.Mock).mock.calls[0];
    const { socios } = JSON.parse(criarOpts.body).templates["template-id"];
    expect(socios).toBe(
      "FULANO DE TAL, BRASILEIRO(A), SOLTEIRO(A), REPRESENTANTE LEGAL, inscrito no CPF/ME sob o n° 39053344705, residente e domiciliado na Cidade de Campinas, Estado de SP, Brasil, com residência na(o) Rua das Flores, N 50, Centro, CEP 13010000",
    );
    expect(socios).not.toContain(",,");
    expect(socios).not.toContain("RG /");
  });

  it("inclui os signatários padrão ativos nos estágios seguintes, com o act correspondente ao papel", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(okJson({ uuid: "doc-uuid-123" }))
      .mockResolvedValueOnce(okJson({}))
      .mockResolvedValueOnce(okJson({}));

    await new D4SignAdapter(fakeSignatarioPadraoRepository([JEAN, VIVI])).gerarEEnviar(input);

    const [, listaOpts] = (global.fetch as jest.Mock).mock.calls[1];
    expect(JSON.parse(listaOpts.body)).toEqual({
      signers: [
        {
          email: "fulano@teste.com",
          act: "1",
          foreign: "0",
          certificadoicpbr: "0",
          assinatura_presencial: "0",
          after_position: "0",
          docauthandselfie: "1",
          videoselfie: "1",
        },
        {
          email: "cadastro@sakuratur.com.br",
          act: "2",
          foreign: "0",
          certificadoicpbr: "0",
          assinatura_presencial: "0",
          after_position: "1",
        },
        {
          email: "vivi.siqueira@sakuratur.com.br",
          act: "4",
          foreign: "0",
          certificadoicpbr: "0",
          assinatura_presencial: "0",
          after_position: "2",
        },
      ],
    });
  });

  it("registra o webhook no documento quando D4SIGN_WEBHOOK_URL está configurada", async () => {
    setEnv({ D4SIGN_WEBHOOK_URL: "https://meusite.com/api/webhooks/d4sign" });
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(okJson({ uuid: "doc-uuid-123" }))
      .mockResolvedValueOnce(okJson({}))
      .mockResolvedValueOnce(okJson({}))
      .mockResolvedValueOnce(okJson({}));

    await new D4SignAdapter(fakeSignatarioPadraoRepository()).gerarEEnviar(input);

    expect(global.fetch).toHaveBeenCalledTimes(4);
    const [webhookUrl, webhookOpts] = (global.fetch as jest.Mock).mock.calls[1];
    expect(webhookUrl).toBe(
      "https://api.teste.d4sign/documents/doc-uuid-123/webhooks?tokenAPI=token-teste&cryptKey=crypt-teste",
    );
    expect(JSON.parse(webhookOpts.body)).toEqual({
      url: "https://meusite.com/api/webhooks/d4sign",
    });
  });

  it("não registra webhook quando D4SIGN_WEBHOOK_URL não está configurada", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(okJson({ uuid: "doc-uuid-123" }))
      .mockResolvedValueOnce(okJson({}))
      .mockResolvedValueOnce(okJson({}));

    await new D4SignAdapter(fakeSignatarioPadraoRepository()).gerarEEnviar(input);

    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("lança erro descritivo se alguma chamada ao D4Sign falhar", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Token inválido" }),
    });

    await expect(
      new D4SignAdapter(fakeSignatarioPadraoRepository()).gerarEEnviar(input),
    ).rejects.toThrow("D4Sign /documents/safe-uuid/makedocumentbytemplateword respondeu 400");
  });

  it.each(["D4SIGN_TOKEN_API", "D4SIGN_CRYPT_KEY", "D4SIGN_SAFE_UUID", "D4SIGN_TEMPLATE_ID"])(
    "lança erro claro se %s não está configurada",
    async (envVar) => {
      setEnv();
      delete process.env[envVar];

      await expect(
        new D4SignAdapter(fakeSignatarioPadraoRepository()).gerarEEnviar(input),
      ).rejects.toThrow(`${envVar} não configurada`);
    },
  );

  describe("registrarWebhook (chamada avulsa, fora de gerarEEnviar)", () => {
    it("registra e retorna registrado:true quando D4SIGN_WEBHOOK_URL está configurada", async () => {
      setEnv({ D4SIGN_WEBHOOK_URL: "https://meusite.com/api/webhooks/d4sign" });
      (global.fetch as jest.Mock).mockResolvedValueOnce(okJson({}));

      const resultado = await new D4SignAdapter(fakeSignatarioPadraoRepository()).registrarWebhook(
        "doc-uuid-999",
      );

      expect(resultado).toEqual({ registrado: true });
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.teste.d4sign/documents/doc-uuid-999/webhooks?tokenAPI=token-teste&cryptKey=crypt-teste",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("retorna registrado:false sem chamar a API quando D4SIGN_WEBHOOK_URL não está configurada", async () => {
      const resultado = await new D4SignAdapter(fakeSignatarioPadraoRepository()).registrarWebhook(
        "doc-uuid-999",
      );

      expect(resultado).toEqual({ registrado: false });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("visualizarDocumento", () => {
    it("resolve o link assinado (/download) e baixa o PDF de lá, retornando buffer + mimeType", async () => {
      const bytes = new TextEncoder().encode("%PDF-fake");
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(okJson({ url: "https://d4sign-files.example.com/assinado?sig=abc" }))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          arrayBuffer: async () => bytes.buffer,
        });

      const resultado = await new D4SignAdapter(
        fakeSignatarioPadraoRepository(),
      ).visualizarDocumento("doc-uuid-1");

      expect(resultado.mimeType).toBe("application/pdf");
      expect(Buffer.from(resultado.buffer).toString()).toBe("%PDF-fake");

      const [linkUrl, linkOpts] = (global.fetch as jest.Mock).mock.calls[0];
      expect(linkUrl).toBe(
        "https://api.teste.d4sign/documents/doc-uuid-1/download?tokenAPI=token-teste&cryptKey=crypt-teste",
      );
      expect(JSON.parse(linkOpts.body)).toEqual({ type: "pdf", language: "pt", encoding: false });

      const [arquivoUrl] = (global.fetch as jest.Mock).mock.calls[1];
      expect(arquivoUrl).toBe("https://d4sign-files.example.com/assinado?sig=abc");
    });

    it("lança erro descritivo se a resolução do link assinado falhar", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(
        new D4SignAdapter(fakeSignatarioPadraoRepository()).visualizarDocumento("doc-inexistente"),
      ).rejects.toThrow("D4Sign /documents/doc-inexistente/download respondeu 404");
    });

    it("lança erro descritivo se o download do PDF pelo link assinado falhar", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(okJson({ url: "https://d4sign-files.example.com/assinado?sig=abc" }))
        .mockResolvedValueOnce({ ok: false, status: 403 });

      await expect(
        new D4SignAdapter(fakeSignatarioPadraoRepository()).visualizarDocumento("doc-uuid-1"),
      ).rejects.toThrow("D4Sign download (signed-URL) respondeu 403");
    });
  });

  describe("obterDocumento", () => {
    it("retorna existe:true com nome e status quando o D4Sign devolve o documento (formato array, docs/d4sign.md §3)", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okJson([{ uuidDoc: "doc-uuid-1", nameDoc: "Contrato Teste", statusName: "Finalizado" }]),
      );

      const resultado = await new D4SignAdapter(fakeSignatarioPadraoRepository()).obterDocumento(
        "doc-uuid-1",
      );

      expect(resultado).toEqual({
        existe: true,
        nomeDocumento: "Contrato Teste",
        statusName: "Finalizado",
      });
    });

    it("retorna existe:false quando o D4Sign devolve array vazio", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(okJson([]));

      const resultado = await new D4SignAdapter(fakeSignatarioPadraoRepository()).obterDocumento(
        "doc-inexistente",
      );

      expect(resultado).toEqual({ existe: false, nomeDocumento: null, statusName: null });
    });

    it("retorna existe:false quando a chamada falha (HTTP ou rede)", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "não encontrado" }),
      });

      const resultado = await new D4SignAdapter(fakeSignatarioPadraoRepository()).obterDocumento(
        "doc-invalido",
      );

      expect(resultado).toEqual({ existe: false, nomeDocumento: null, statusName: null });
    });
  });

  describe("obterDestinatarios", () => {
    it("extrai os e-mails da lista de signatários (formato array), sem status reconhecido", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okJson([{ email: "socio@agencia.com" }, { email: "cadastro@sakuratur.com.br" }]),
      );

      const resultado = await new D4SignAdapter(
        fakeSignatarioPadraoRepository(),
      ).obterDestinatarios("doc-uuid-1");

      expect(resultado).toEqual([
        { email: "socio@agencia.com", assinado: null, assinadoEm: null },
        { email: "cadastro@sakuratur.com.br", assinado: null, assinadoEm: null },
      ]);
    });

    it("ignora entradas sem e-mail", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okJson([{ email: "socio@agencia.com" }, { nome: "sem e-mail" }]),
      );

      const resultado = await new D4SignAdapter(
        fakeSignatarioPadraoRepository(),
      ).obterDestinatarios("doc-uuid-1");

      expect(resultado).toEqual([{ email: "socio@agencia.com", assinado: null, assinadoEm: null }]);
    });

    it("reconhece o campo `signed` booleano quando presente", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okJson([
          { email: "socio1@agencia.com", signed: true },
          { email: "socio2@agencia.com", signed: false },
        ]),
      );

      const resultado = await new D4SignAdapter(
        fakeSignatarioPadraoRepository(),
      ).obterDestinatarios("doc-uuid-1");

      expect(resultado).toEqual([
        { email: "socio1@agencia.com", assinado: true, assinadoEm: null },
        { email: "socio2@agencia.com", assinado: false, assinadoEm: null },
      ]);
    });

    it("reconhece `statusName` textual (assinado/pendente) e `signAt` como data", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okJson([
          { email: "socio1@agencia.com", statusName: "Assinado", signAt: "2026-07-29T12:00:00Z" },
          { email: "socio2@agencia.com", statusName: "Aguardando assinatura" },
        ]),
      );

      const resultado = await new D4SignAdapter(
        fakeSignatarioPadraoRepository(),
      ).obterDestinatarios("doc-uuid-1");

      expect(resultado).toEqual([
        {
          email: "socio1@agencia.com",
          assinado: true,
          assinadoEm: new Date("2026-07-29T12:00:00Z"),
        },
        { email: "socio2@agencia.com", assinado: false, assinadoEm: null },
      ]);
    });
  });
});
