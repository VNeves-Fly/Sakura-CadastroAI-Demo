import { FlysakuraAnaliseIaAdapter } from "@/modules/cadastro/infrastructure/adapters/flysakura-analise-ia.adapter";
import type { AnaliseIaInput } from "@/modules/cadastro/domain/services/analise-ia-service";

const originalEnv = process.env;

const input: AnaliseIaInput = {
  cnpj: "19131243000197",
  razaoSocial: "Agência Teste",
  email: "contato@agenciateste.com",
  socios: [
    {
      nome: "Fulano de Tal",
      cpf: "39053344705",
      dataNascimento: "1990-04-12",
      rgPath: "cadastro-ai/agencias/x/socio-0-rg.pdf",
      rgAnalise: {
        camposExtraidos: { nome: "Fulano de Tal", cpf: "390.533.447-05" },
        camposExtras: {},
        confiancaExtracao: 0.97,
        alertas: [],
        resumoAnalise: null,
        textoBruto: null,
        checagens: null,
      },
    },
  ],
};

describe("FlysakuraAnaliseIaAdapter", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      AGENCY_ANALYSIS_API_KEY: "secret-teste",
      AGENCY_ANALYSIS_BASE_URL: "https://agente.teste",
    };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("monta o payload certo pro agente, reaproveitando o resultado já extraído na etapa 3", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ parecer: "APROVADO", justificativa: "", flags_risco: [] }),
    });

    const resultado = await new FlysakuraAnaliseIaAdapter().avaliar(input);

    expect(resultado).toEqual({
      aprovado: true,
      motivo: null,
      parecer: "APROVADO",
      flagsRisco: [],
      detalhamento: null,
      stage1: null,
      stage2: null,
      rawData: null,
    });

    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("https://agente.teste/api/v1/agency-analysis/sync");
    expect(opts.headers["X-Internal-Secret"]).toBe("secret-teste");
    expect(JSON.parse(opts.body)).toEqual({
      cnpj: "19131243000197",
      channel: "api",
      language: "pt-br",
      session_id: "19131243000197",
      include_raw_data: true,
      analysis_data: {
        cnpj: "19131243000197",
        focus: "completo",
        verificar_processos: false,
        verificar_amat: true,
        razao_social: "Agência Teste",
        email: "contato@agenciateste.com",
        socios: [
          {
            nome: "Fulano de Tal",
            documento_identificacao: "39053344705",
            data_nascimento: "1990-04-12",
            documentos: [
              {
                document_type: "doc_identificacao",
                campos_extraidos: { nome: "Fulano de Tal", cpf: "390.533.447-05" },
                confidence_score: 0.97,
                alertas: [],
              },
            ],
          },
        ],
        amat_cpfs_socios: ["39053344705"],
      },
    });
  });

  it("mapeia PENDENTE/REPROVADO/null como não aprovado, usando a justificativa como motivo", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        parecer: "REPROVADO",
        justificativa: "CNAE incompatível com agência de viagem",
        flags_risco: ["cnae_incompativel"],
      }),
    });

    const resultado = await new FlysakuraAnaliseIaAdapter().avaliar(input);

    expect(resultado).toEqual({
      aprovado: false,
      motivo: "CNAE incompatível com agência de viagem",
      parecer: "REPROVADO",
      flagsRisco: ["cnae_incompativel"],
      detalhamento: null,
      stage1: null,
      stage2: null,
      rawData: null,
    });
  });

  it("mapeia a stage1 (dados oficiais da Receita/BrasilAPI, via AgentsService)", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        parecer: "APROVADO",
        justificativa: "",
        flags_risco: [],
        stage1: {
          executed: true,
          situacao_cadastral: "ATIVA",
          cnae_principal: {
            codigo: "79.11-2-00",
            description: "Agências de viagens",
            compativel_turismo: true,
          },
          razao_social: {
            fornecido: "Agência Teste",
            oficial: "AGENCIA TESTE LTDA",
            confere: true,
          },
          nome_fantasia: { fornecido: null, oficial: "Agência Teste", confere: null },
          socios: {
            fornecidos: [{ nome: "Fulano de Tal" }],
            oficiais: [{ nome: "Fulano de Tal", cpf: "39053344705" }],
            divergencias: [],
          },
        },
      }),
    });

    const resultado = await new FlysakuraAnaliseIaAdapter().avaliar(input);

    expect(resultado.stage1).toEqual({
      situacaoCadastral: "ATIVA",
      cnaePrincipal: {
        codigo: "79.11-2-00",
        descricao: "Agências de viagens",
        compativelTurismo: true,
      },
      cnaesSecundarios: [],
      razaoSocial: { fornecido: "Agência Teste", oficial: "AGENCIA TESTE LTDA", confere: true },
      nomeFantasia: { fornecido: null, oficial: "Agência Teste", confere: null },
      email: null,
      socios: {
        fornecidos: [{ nome: "Fulano de Tal" }],
        oficiais: [{ nome: "Fulano de Tal", cpf: "39053344705" }],
        divergencias: [],
      },
      processos: null,
    });
  });

  it("mapeia cnaes_secundarios, email e processos da stage1 (achado de docs/agency-analysis-params-tracking.md)", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        parecer: "REPROVADO",
        justificativa: "CNAE incompatível com turismo",
        flags_risco: ["CNAE incompatível com turismo", "Email não corporativo ou inexistente"],
        stage1: {
          executed: true,
          situacao_cadastral: "ATIVA",
          cnae_principal: {
            codigo: "6462000",
            description: "Holdings de instituições não-financeiras",
            compativel_turismo: false,
          },
          cnaes_secundarios: [
            { codigo: "7911200", description: "Agências de viagens", compativel_turismo: true },
          ],
          razao_social: { fornecido: "Agência Teste", oficial: "Agência Teste", confere: true },
          nome_fantasia: { fornecido: null, oficial: "Agência Teste", confere: true },
          email: { fornecido: "contato@agenciateste.com", has_mx: false, corporativo: false },
          socios: { fornecidos: [], oficiais: [], divergencias: [] },
          processos: { verificado: false, resumo: "Não verificado por solicitação do usuário." },
        },
      }),
    });

    const resultado = await new FlysakuraAnaliseIaAdapter().avaliar(input);

    expect(resultado.stage1?.cnaesSecundarios).toEqual([
      { codigo: "7911200", descricao: "Agências de viagens", compativelTurismo: true },
    ]);
    expect(resultado.stage1?.email).toEqual({
      fornecido: "contato@agenciateste.com",
      hasMx: false,
      corporativo: false,
    });
    expect(resultado.stage1?.processos).toEqual({
      verificado: false,
      resumo: "Não verificado por solicitação do usuário.",
    });
  });

  it("mapeia o stage3 (cruzamento documento x oficial x fornecido) para o detalhamento", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        parecer: "PENDENTE",
        justificativa: "Data de nascimento divergente",
        flags_risco: ["data_nascimento_divergente"],
        stage3: {
          documentos_empresa: [
            {
              tipo: "cadastur",
              campos: [
                {
                  campo: "cnpj",
                  extraido: "19131243000197",
                  oficial: "19131243000197",
                  fornecido: "19131243000197",
                  confere: true,
                },
              ],
              alertas_extracao: [],
              valido: true,
            },
          ],
          socios: [
            {
              nome: "Fulano de Tal",
              documentos: [
                {
                  tipo: "rg",
                  campos: [
                    {
                      campo: "data_nascimento",
                      extraido: "12/04/1990",
                      oficial: null,
                      fornecido: "1990-04-13",
                      confere: false,
                    },
                  ],
                  alertas_extracao: [],
                  valido: false,
                },
              ],
            },
          ],
        },
      }),
    });

    const resultado = await new FlysakuraAnaliseIaAdapter().avaliar(input);

    expect(resultado.detalhamento).toEqual({
      documentosEmpresa: [
        {
          tipo: "cadastur",
          campos: [
            {
              campo: "cnpj",
              extraido: "19131243000197",
              oficial: "19131243000197",
              fornecido: "19131243000197",
              confere: true,
            },
          ],
          alertasExtracao: [],
          valido: true,
        },
      ],
      socios: [
        {
          nome: "Fulano de Tal",
          documentos: [
            {
              tipo: "rg",
              campos: [
                {
                  campo: "data_nascimento",
                  extraido: "12/04/1990",
                  oficial: null,
                  fornecido: "1990-04-13",
                  confere: false,
                },
              ],
              alertasExtracao: [],
              valido: false,
            },
          ],
        },
      ],
    });
  });

  it("manda amat_cpfs_socios com os CPFs de todos os sócios", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ parecer: "APROVADO", justificativa: "", flags_risco: [] }),
    });

    await new FlysakuraAnaliseIaAdapter().avaliar(input);

    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(opts.body).analysis_data.amat_cpfs_socios).toEqual(["39053344705"]);
  });

  it("mapeia o stage2 (AMAT tipado + sofia/processos/reclamações como dict livre)", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        parecer: "APROVADO",
        justificativa: "",
        flags_risco: [],
        stage2: {
          sofia: { status: "CONSTA", motivo: "restrição cadastral" },
          processos_judiciais: null,
          reclamacoes: null,
          amat: {
            consultado: true,
            ultima_consulta: "2026-07-27T10:00:00Z",
            empresa: {
              pefin: { qtde: 1, total: 500.5, itens: [{ credor: "Banco X" }] },
              refin: { qtde: 0, total: 0, itens: [] },
              protestos: { qtde: 0, total: 0, itens: [] },
              cheques_sem_fundo: { qtde: 0, total: 0, itens: [] },
              dividas_vencidas: { qtde: 0, total: 0, itens: [] },
              total_pendencias: 500.5,
            },
            socios_com_restricao: [
              {
                nome: "Fulano de Tal",
                cpf: "39053344705",
                perc_participacao: 50,
                cargo: "Sócio-administrador",
                pendencias: {
                  pefin: { qtde: 2, total: 1200, itens: [] },
                  refin: { qtde: 0, total: 0, itens: [] },
                  protestos: { qtde: 0, total: 0, itens: [] },
                  cheques_sem_fundo: { qtde: 0, total: 0, itens: [] },
                  dividas_vencidas: { qtde: 0, total: 0, itens: [] },
                  total_pendencias: 1200,
                },
              },
            ],
            total_geral: 1700.5,
          },
          debt_total: 1700.5,
        },
      }),
    });

    const resultado = await new FlysakuraAnaliseIaAdapter().avaliar(input);

    expect(resultado.stage2).toEqual({
      sofia: { status: "CONSTA", motivo: "restrição cadastral" },
      processosJudiciais: null,
      reclamacoes: null,
      amat: {
        consultado: true,
        ultimaConsulta: "2026-07-27T10:00:00Z",
        empresa: {
          pefin: { qtde: 1, total: 500.5, itens: [{ credor: "Banco X" }] },
          refin: { qtde: 0, total: 0, itens: [] },
          protestos: { qtde: 0, total: 0, itens: [] },
          chequesSemFundo: { qtde: 0, total: 0, itens: [] },
          dividasVencidas: { qtde: 0, total: 0, itens: [] },
          totalPendencias: 500.5,
        },
        sociosComRestricao: [
          {
            nome: "Fulano de Tal",
            cpf: "39053344705",
            percParticipacao: 50,
            cargo: "Sócio-administrador",
            pendencias: {
              pefin: { qtde: 2, total: 1200, itens: [] },
              refin: { qtde: 0, total: 0, itens: [] },
              protestos: { qtde: 0, total: 0, itens: [] },
              chequesSemFundo: { qtde: 0, total: 0, itens: [] },
              dividasVencidas: { qtde: 0, total: 0, itens: [] },
              totalPendencias: 1200,
            },
          },
        ],
        totalGeral: 1700.5,
      },
      debtTotal: 1700.5,
    });
  });

  it("repassa raw_data como veio, agrupado por fonte (tool/args/output)", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        parecer: "APROVADO",
        justificativa: "",
        flags_risco: [],
        raw_data: {
          amat: [
            {
              tool: "search_amat_debts",
              args: { documento: "39053344705" },
              output: { encontrado: true, total: 1200 },
            },
          ],
          sofia: [{ tool: "sofia_agency_lookup", args: { cnpj: "19131243000197" }, output: null }],
        },
      }),
    });

    const resultado = await new FlysakuraAnaliseIaAdapter().avaliar(input);

    expect(resultado.rawData).toEqual({
      amat: [
        {
          tool: "search_amat_debts",
          args: { documento: "39053344705" },
          output: { encontrado: true, total: 1200 },
        },
      ],
      sofia: [{ tool: "sofia_agency_lookup", args: { cnpj: "19131243000197" }, output: null }],
    });
  });

  it("lança erro descritivo quando o agente responde erro (ex: 'agent_execution_failed')", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => '{"detail":"agent_execution_failed"}',
    });

    await expect(new FlysakuraAnaliseIaAdapter().avaliar(input)).rejects.toThrow(
      'agency-analysis respondeu 500: {"detail":"agent_execution_failed"}',
    );
  });

  it("lança erro claro se AGENCY_ANALYSIS_API_KEY não está configurada", async () => {
    delete process.env.AGENCY_ANALYSIS_API_KEY;

    await expect(new FlysakuraAnaliseIaAdapter().avaliar(input)).rejects.toThrow(
      "AGENCY_ANALYSIS_API_KEY não configurada",
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
