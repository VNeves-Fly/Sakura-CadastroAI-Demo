import { obterIpCliente, verificarRateLimit } from "@/modules/shared/infrastructure/rate-limiter";

describe("verificarRateLimit", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Cada teste usa uma chave única (`test.concat(Math.random())` seria
  // frágil com fake timers — usamos o nome do teste como chave) porque o
  // Map de janelas é um singleton do módulo, compartilhado entre testes.

  it("permite chamadas até o limite dentro da janela", () => {
    const chave = "rota-a";
    const config = { limite: 3, janelaMs: 1000 };

    expect(verificarRateLimit(chave, config)).toBe(true);
    expect(verificarRateLimit(chave, config)).toBe(true);
    expect(verificarRateLimit(chave, config)).toBe(true);
  });

  it("bloqueia a chamada que estoura o limite na mesma janela", () => {
    const chave = "rota-b";
    const config = { limite: 2, janelaMs: 1000 };

    expect(verificarRateLimit(chave, config)).toBe(true);
    expect(verificarRateLimit(chave, config)).toBe(true);
    expect(verificarRateLimit(chave, config)).toBe(false);
  });

  it("libera de novo depois que a janela expira", () => {
    const chave = "rota-c";
    const config = { limite: 1, janelaMs: 1000 };

    expect(verificarRateLimit(chave, config)).toBe(true);
    expect(verificarRateLimit(chave, config)).toBe(false);

    jest.advanceTimersByTime(1001);

    expect(verificarRateLimit(chave, config)).toBe(true);
  });

  it("mantém contadores independentes por chave", () => {
    const config = { limite: 1, janelaMs: 1000 };

    expect(verificarRateLimit("rota-d-1", config)).toBe(true);
    expect(verificarRateLimit("rota-d-2", config)).toBe(true);
    // a segunda chamada na MESMA chave que já é reaproveitada de outro
    // teste não deve importar — chaves diferentes nunca se afetam.
    expect(verificarRateLimit("rota-d-1", config)).toBe(false);
    expect(verificarRateLimit("rota-d-2", config)).toBe(false);
  });
});

describe("obterIpCliente", () => {
  it("usa x-forwarded-for quando presente", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.10" },
    });
    expect(obterIpCliente(request)).toBe("203.0.113.10");
  });

  it("pega o primeiro IP e remove espaços quando há vários em x-forwarded-for", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.10 , 198.51.100.20" },
    });
    expect(obterIpCliente(request)).toBe("203.0.113.10");
  });

  it("cai pra x-real-ip quando não há x-forwarded-for", () => {
    const request = new Request("http://localhost", {
      headers: { "x-real-ip": "198.51.100.20" },
    });
    expect(obterIpCliente(request)).toBe("198.51.100.20");
  });

  it("retorna 'desconhecido' quando nenhum header de IP está presente", () => {
    const request = new Request("http://localhost");
    expect(obterIpCliente(request)).toBe("desconhecido");
  });
});
