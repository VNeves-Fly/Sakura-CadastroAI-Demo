# Tracking — parâmetros de análise + expansão do `/agency-analysis/sync`

Acompanhamento do trabalho iniciado a partir da revisão de
`agency-analysis-sync.md` (que ficou desatualizado depois do commit
`101fcdd`, "integrate Stage 1 AI analysis"). Este arquivo é vivo — atualizar
os checkboxes conforme cada item avança, não recriar um novo doc a cada
sessão.

**Branch no momento da revisão:** `feature/app_update` · **Aberto em:** 2026-07-25

## 1. Contexto

O agents-service ganhou (ou vai ganhar) suporte a parâmetros que hoje não são
controláveis no nosso domínio:

- `include_official_data` (default `false`) — busca dado em fonte oficial
  (Receita) pra comparar com o extraído do documento.
- `include_verdict` (default `true`) — traz o parecer da IA sobre o
  documento.
- `additional_data` — permite mandar dados que já temos (digitados no
  wizard) pra IA cruzar contra o que ela extraiu do documento. Fluxo ainda
  não implementado de nenhum dos dois lados.

Além disso, o body final de `/agency-analysis/sync` (avaliação completa do
cadastro, disparada por `AnalisarCadastroUseCase`) manda hoje só
cnpj/razão social/email/sócios+RG — sem endereço, telefone, dados bancários
ou o resultado do contrato social.

## 2. Estado atual confirmado na revisão (já implementado, doc antigo não refletia)

- [x] `stage1` (verificação cadastral oficial — situação cadastral, CNAE,
      razão social/nome fantasia comparados) em `AnaliseIaResultado.stage1`
      (`flysakura-analise-ia.adapter.ts`).
- [x] `FinalizarCadastroUseCase` não chama mais a IA — só persiste com
      status `em_analise`. `AnalisarCadastroUseCase` roda depois, em
      background (fire-and-forget), disparado pela rota.
- [x] Veredito da IA exposto ao analista — `AgenciaDetalhe.analiseIa` →
      `dossie.adapter.ts` (`paraParecerView`) → `dossie.view-model.ts` →
      renderizado em `dossie-campos.tsx` (`/admin/painel/[id]` e
      `/admin/arquivo/[id]`).
- [x] Enum `ResultadoAnaliseIa` (`APROVADO`/`REPROVADO`/`FALHA_ANALISE`/
      `FALHA_CONTRATO`) distingue reprovação real de falha técnica.
- [x] Nenhuma estrutura de código órfã relevante encontrada. `ReceitaWS`
      (QSA) continua ativo e não é redundante com `stage1` — propósitos
      diferentes (autofill no wizard vs. verificação pós-submissão).

## 3. Pendências

- [x] **Chamadas de teste contra o agents real** (Testes 1, 2, 3, 3b e 4,
      2026-07-25) — todas concluídas, shapes confirmados o suficiente pra
      tipar e implementar os itens abaixo.
- [x] **`include_official_data`/`include_verdict` como parâmetros de
      domínio.** Implementado: `DocumentAnalysisInput` ganhou
      `includeVerdict?`/`includeOfficialData?`, com default aplicado no
      adapter (`includeOfficialData = false`, `includeVerdict = true`) —
      nenhum call site existente precisou mudar pra manter o comportamento
      de hoje.
- [x] **Novo: capturar `parecer` (veredito por documento) e
      `comparacao_oficial` na resposta.** Achado do Teste 1 — a resposta já
      traz `parecer` (string) no nível raiz mesmo sem termos pedido nada de
      novo, e `flysakura-document-analysis.adapter.ts` não lê nem `parecer`
      nem `comparacao_oficial` hoje (ambos descartados silenciosamente).
      `DocumentAnalysisResultado` precisa ganhar esses dois campos.

      **Confirmado no Teste 3:** `comparacao_oficial` é um array de
              `{ campo, extraido, oficial, fornecido, confere }` — **exatamente o
              shape de `AnaliseIaComparacaoCampo`**, já definido em
              `analise-ia-service.ts` (usado hoje no parsing do `stage3`). Reusar
              esse tipo em vez de criar um novo (DRY) — só alargar
              `confere: boolean` → `boolean | null` (veio `null` quando `extraido`
              também é `null`, nada a comparar). Faz sentido mover esse tipo pra um
              lugar compartilhado entre `document-analysis-service.ts` e
              `analise-ia-service.ts` já que os dois vão depender dele, em vez de um
              importar do outro. `parecer` usa o mesmo union já existente em
              `FlysakuraAnaliseIaAdapter`: `"APROVADO" | "PENDENTE" | "REPROVADO" |
              null`.

              **Confirmado pelo time do agents (2026-07-25):** `comparacao_oficial`
              só é preenchido pra `document_type: "contrato_social"` (tem CNPJ pra
              buscar). Pra `rg`/`cnh`/`doc_identificacao`/`cpf` sempre vem `null` —
              não existe hoje serviço de consulta oficial pra esses tipos. Ou seja:
              `include_official_data: true` só faz sentido mandar quando
              `documentType === "contrato_social"` — nos outros casos é um no-op
              (mas inofensivo mandar mesmo assim, já que a resposta cai em `null`).

              | document_type        | Tem CNPJ? | Consulta oficial? | `comparacao_oficial` |
              | --------------------- | --------- | ------------------ | --------------------- |
              | `contrato_social`     | Sim       | Sim                 | Preenchido             |
              | `rg`                  | Não       | Não                 | `null`                 |
              | `cnh`                 | Não       | Não                 | `null`                 |
              | `doc_identificacao`   | Não       | Não                 | `null`                 |
              | `cpf`                 | Não       | Não                 | `null`                 |

- [x] **`additional_data`.** Implementado: `additionalData?: Record<string,
    unknown>` em `DocumentAnalysisInput`, mapeado pro `additional_data` do
      request (omitido do body quando `undefined`, via `JSON.stringify`).
      Sem parsing de resposta novo — confirmado no Teste 2.
- [ ] **~~Expandir o body do `/agency-analysis/sync`~~ → rebaixado.**
      **Confirmado no Teste 4:** mandar `telefone`/`endereco` extras em
      `analysis_data` não teve nenhum efeito observável na resposta — o
      agente parece ignorar campos fora do schema. Não vale implementar do
      nosso lado agora; virou pergunta pro time do agents (eles pretendem
      processar esses campos?) antes de qualquer trabalho aqui.
- [x] **Novo (achado no Teste 4): capturar `stage1.email`,
      `stage1.processos` e `stage1.cnaesSecundarios`.** Implementado em
      `AnaliseIaStage1` + `flysakura-analise-ia.adapter.ts` (`mapStage1`).
- [ ] **Não implementar ainda — `receita_data` (raiz) e `stage2`.** Ambos
      vieram `null` em todos os testes desta sessão (CNPJ de teste foi
      reprovado cedo pelo gate de CNAE-turismo, nunca chegou em stage2/3).
      Shape desconhecido — precisa de um teste com CNPJ de atividade
      turística pra ver populado antes de tipar.
- [ ] **Auto-atualização do painel admin (Zustand).** Confirmado: não existe
      hoje nenhum polling/realtime (`setInterval`/SWR/EventSource) — o
      analista só vê o resultado da análise em background dando refresh
      manual. Precisa de uma store Zustand + estratégia de polling (ou
      similar) pro painel refletir sozinho quando `AnalisarCadastroUseCase`
      termina.
- [ ] **Atualizar docs desatualizados** — reescrever
      `agency-analysis-sync.md` (stage1, split
      Finalizar/AnalisarCadastroUseCase, exposição já feita ao analista) e
      corrigir `flysakura.md` (ainda cita `/agency-analysis/json`).

## 3.1. Implementação (2026-07-25)

Arquivos alterados pros 4 itens marcados `[x]` acima:

- `src/modules/cadastro/domain/services/document-analysis-service.ts`
  - `DocumentAnalysisInput` ganhou `includeVerdict?`, `includeOfficialData?`,
    `additionalData?: Record<string, unknown>`.
  - Novo `AnaliseIaComparacaoCampo` (movido de `analise-ia-service.ts`, com
    `confere: boolean | null` em vez de `boolean`).
  - `DocumentAnalysisResultado` ganhou `parecer?: string | null` e
    `comparacaoOficial?: AnaliseIaComparacaoCampo[] | null`.
- `src/modules/cadastro/domain/services/analise-ia-service.ts`
  - Reexporta `AnaliseIaComparacaoCampo` de `document-analysis-service.ts`
    em vez de definir localmente (DRY — um import direction só, mesmo
    sentido que já existia pra `DocumentAnalysisResultado`).
  - `AnaliseIaStage1` ganhou `cnaesSecundarios`, `email`, `processos`.
- `src/modules/cadastro/infrastructure/adapters/flysakura-document-analysis.adapter.ts`
  - Envia `include_verdict`/`include_official_data` com os defaults
    (override via input), `additional_data` (omitido quando `undefined`).
  - Parseia `parecer`/`comparacao_oficial` da resposta.
- `src/modules/cadastro/infrastructure/adapters/flysakura-analise-ia.adapter.ts`
  - `mapStage1` ganhou `cnaes_secundarios`/`email`/`processos`.
- Testes atualizados/adicionados nos dois arquivos de teste dos adapters
  acima (defaults, override explícito, parsing dos campos novos).

**Não alterado (decisão deliberada, escopo contido):**
`analisar-contrato-social.use-case.ts`, `analisar-documento-identificacao.use-case.ts`
e `analisar-cadastro.use-case.ts` continuam chamando
`documentAnalysisService.analisar()` sem passar os novos parâmetros — os
defaults preservam 100% do comportamento atual. Nenhum desses 3 use-cases
foi alterado pra ligar `includeOfficialData: true` em `contrato_social`
porque isso duplicaria a verificação oficial que `stage1` (nível agência)
já faz em `AnalisarCadastroUseCase` — ligar isso é uma decisão de produto
separada (custo extra de chamada), não parte deste trabalho. Da mesma
forma, `parecer`/`comparacaoOficial` por documento **não foram expostos em
nenhum DTO/UI** ainda — só deixaram de ser descartados silenciosamente no
domínio/adapter. Expor ao analista é um próximo passo em aberto, não
assumido aqui.

Verificação: `tsc --noEmit`, `eslint`, `prettier --check` e suíte completa
(465 testes) sem erros.

## 4. Chamadas de teste — aguardando resposta real do agents

Rodar localmente com `AGENCY_ANALYSIS_API_KEY` do `.env` e colar a resposta
bruta aqui (ou na conversa) antes de implementar o parsing tipado.

### Teste 1 — `include_official_data` num `doc_identificacao`

Hipótese: não deve mudar nada (RG não tem fonte oficial pra comparar).

```bash
curl -s -X POST https://agents.flysakura.com/api/v1/agency-analysis/documents/analyze/sync \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: $AGENCY_ANALYSIS_API_KEY" \
  -d '{
    "internal_document_url": "gs://c2f-sakura-prod/doc-test/rg_cnpj_JOSE CARLOS PRESTES JUNIOR_Documento Jose Atual.jpg",
    "document_type": "doc_identificacao",
    "channel": "api",
    "language": "pt-br",
    "include_official_data": true,
    "include_verdict": true
  }'
```

**Resposta (2026-07-25):** confirma a hipótese — `comparacao_oficial: null`. Não
existe fonte oficial pra cruzar um RG/CNH (sem "Receita" de pessoa física);
só deve vir populado em documentos ligados a CNPJ (ver Teste 3).

Achado não previsto: a resposta trouxe `parecer: "REPROVADO"` no nível raiz
— veredito **por documento** do `include_verdict: true`. Hoje
`DocumentAnalysisResultado` (domínio) não tem campo pra isso e
`flysakura-document-analysis.adapter.ts` não lê `data.parecer` em nenhum
lugar — esse dado está sendo descartado silenciosamente. Vira item novo em
"Pendências" (seção 3): adicionar `parecer`/veredito ao domínio, não só
`comparacaoOficial`.

Resto do shape bate com o que já parseamos (`extracted_content.fields` →
`camposExtraidos`, `agent_analysis` → `resumoAnalise`, `observations`/
`errors` → `alertas`, `validation_checks` → `checagens`). Reprovação nesse
teste foi porque o documento (CNH) está com data de validade vencida
(20/07/2026, hoje 25/07/2026) — validação de data real da IA, não
relacionado ao nosso código.

```json
{
  "extracted_content": {
    "fields": {
      "tipo_documento_identificado": "CNH",
      "nome_completo": "JOSE CARLOS PRESTES JUNIOR",
      "cpf": "033.829.868-17",
      "data_nascimento": "22/11/1959",
      "filiacao_completa": "JOSE CARLOS PRESTES, MARIA CECILIA FRALETTI PRESTES",
      "naturalidade": null,
      "numero_documento": "01272990932",
      "data_emissao": "21/07/2021",
      "data_validade": "20/07/2026",
      "rg": { "value": "8455345", "expedidor": "SSP", "expedidor_uf": "SP" },
      "categoria": "AB"
    },
    "confidence_score": 0.98,
    "raw_text": null,
    "extra_fields": { "primeira_habilitacao": "13/01/1978" }
  },
  "agent_analysis": "O documento enviado é uma Carteira Nacional de Habilitação (CNH). A extração dos dados foi bem-sucedida. Observa-se que o documento encontra-se vencido, visto que a data de validade é 20/07/2026 e a data atual é 25/07/2026.",
  "observations": [
    "ALERT_CRITICAL: O documento encontra-se vencido desde 20/07/2026.",
    "INFO: Documento identificado como CNH.",
    "INFO: Campo naturalidade não consta no layout do documento."
  ],
  "validation_checks": {
    "format_valid": true,
    "required_fields_present": false,
    "cross_reference_ok": true,
    "details": { "documento_vencido": true, "layout_cnh": true }
  },
  "errors": [
    "Campo naturalidade não encontrado no documento.",
    "Documento vencido (Data de validade: 20/07/2026, Data atual: 25/07/2026)."
  ],
  "parecer": "REPROVADO",
  "comparacao_oficial": null
}
```

### Teste 2 — `additional_data` no mesmo documento

```bash
curl -s -X POST https://agents.flysakura.com/api/v1/agency-analysis/documents/analyze/sync \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: $AGENCY_ANALYSIS_API_KEY" \
  -d '{
    "internal_document_url": "gs://c2f-sakura-prod/doc-test/rg_cnpj_JOSE CARLOS PRESTES JUNIOR_Documento Jose Atual.jpg",
    "document_type": "doc_identificacao",
    "channel": "api",
    "language": "pt-br",
    "include_official_data": false,
    "include_verdict": true,
    "additional_data": {
      "nome": "Jose Carlos Prestes Junior",
      "cpf": "00000000000",
      "data_nascimento": "1980-01-01"
    }
  }'
```

**Resposta (2026-07-25):** funciona como esperado — CPF e data de nascimento
divergentes de propósito (`00000000000`/`1980-01-01`) foram sinalizados
como `ALERT_CRITICAL` em `observations`/`errors`; nome (correto) não gerou
alerta, confirmando que só diverge o que realmente diverge. `parecer` voltou
`REPROVADO` (mesmo documento vencido do Teste 1, mais as divergências).

Achado importante: **a comparação de `additional_data` não vem em nenhum
campo estruturado novo** — só como texto livre dentro de
`observations`/`errors` ("Divergência nos dados de CPF: esperado X,
encontrado Y"). O único sinal estruturado é o que já existe hoje:
`validation_checks.cross_reference_ok` (→ `checagens.referenciaCruzadaOk`,
foi `false`) e `validation_checks.details.cross_reference_errors` (contagem,
`3` — já cai dentro de `checagens.detalhes`, que é `Record<string,
unknown>` genérico). **Ou seja: dar suporte a `additional_data` não exige
nenhum campo novo de resposta além do `parecer` já identificado no Teste
1** — só precisa do lado do request (`additionalData` em
`DocumentAnalysisInput`, mapeado pro `additional_data` do body). Extrair
"qual campo divergiu" exigiria parsear texto livre (frágil) — melhor só
repassar os alertas como estão pro analista em vez de tentar estruturar.

```json
{
  "extracted_content": { "...": "idêntico ao Teste 1" },
  "agent_analysis": "O documento enviado é uma Carteira Nacional de Habilitação (CNH). A análise de qualidade indica que o documento está legível, porém o cruzamento de dados com as informações fornecidas pelo cliente (nome, CPF, data de nascimento) apresentou divergências críticas. Além disso, a CNH está com a validade vencida em relação à data atual (20/07/2026 vs 25/07/2026).",
  "observations": [
    "ALERT_CRITICAL: O documento está vencido desde 20/07/2026.",
    "ALERT_CRITICAL: Divergência nos dados de CPF: esperado '00000000000', encontrado '033.829.868-17'.",
    "ALERT_CRITICAL: Divergência na data de nascimento: esperado '1980-01-01', encontrado '22/11/1959'.",
    "INFO: Campo 'naturalidade' não foi encontrado no documento.",
    "INFO: Documento validado como CNH, categoria AB."
  ],
  "validation_checks": {
    "format_valid": true,
    "required_fields_present": false,
    "cross_reference_ok": false,
    "details": { "validade_check": "vencido", "cross_reference_errors": 3 }
  },
  "errors": [
    "Campo 'naturalidade' não encontrado.",
    "Divergência crítica nos dados de identificação do titular.",
    "Documento de identificação vencido."
  ],
  "parecer": "REPROVADO",
  "comparacao_oficial": null
}
```

### Teste 3 — `include_official_data` num `contrato_social`

Aqui sim deve ter comparação com Receita (CNPJ). Precisa de um path de
contrato social de teste (equivalente ao `rg_cnpj_JOSE...` em
`gs://c2f-sakura-prod/doc-test/`, ou reaproveitar o CNPJ da LARIAN GROUP,
62.572.350/0001-80, já usado em testes anteriores).

```bash
curl -s -X POST https://agents.flysakura.com/api/v1/agency-analysis/documents/analyze/sync \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: $AGENCY_ANALYSIS_API_KEY" \
  -d '{
    "internal_document_url": "gs://c2f-sakura-prod/doc-test/<SEU_ARQUIVO_CONTRATO_SOCIAL>",
    "document_type": "contrato_social",
    "channel": "api",
    "language": "pt-br",
    "include_official_data": true,
    "include_verdict": true
  }'
```

**Resposta (2026-07-25):** `comparacao_oficial` veio populado — array de
objetos `{ campo, extraido, oficial, fornecido, confere }`. **Achado ótimo
pra DRY: é exatamente o mesmo shape que `AnaliseIaComparacaoCampo`**, já
definido em `analise-ia-service.ts` e usado no parsing do `stage3` do
`/agency-analysis/sync` — dá pra reaproveitar o tipo em vez de criar um
novo, só precisa alargar `confere` pra `boolean | null` (veio `null` no
campo `natureza_juridica`, quando `extraido` também é `null` — nada a
comparar). `fornecido` veio sempre `null` nesse teste porque não mandamos
`additional_data` junto (sem dado "fornecido pelo cadastrante" pra
cruzar).

`parecer: "APROVADO"` confirma o mesmo union já usado no nível de agência
(`"APROVADO" | "PENDENTE" | "REPROVADO" | null`, ver
`FlysakuraAnaliseIaAdapter`) — não é um enum novo, é o mesmo conceito
reaproveitado por documento.

```json
{
  "extracted_content": {
    "...": "razao_social, cnpj, qsa[], endereco, capital_social, objeto_social etc. — já cai em camposExtraidos"
  },
  "agent_analysis": "O documento analisado é um Instrumento Particular de Contrato Social por Transformação de Empresário em Sociedade Empresária Limitada, devidamente registrado na JUCEES...",
  "observations": [
    "Documento classificado como Contrato Social formal.",
    "Data de assinatura e registro identificadas corretamente.",
    "Qualidade do documento excelente, com todas as informações legíveis."
  ],
  "validation_checks": {
    "format_valid": true,
    "required_fields_present": true,
    "cross_reference_ok": true,
    "details": {
      "razao_social": "Presente",
      "cnpj": "Presente",
      "qsa": "Presente",
      "endereco": "Presente"
    }
  },
  "errors": [],
  "parecer": "APROVADO",
  "comparacao_oficial": [
    {
      "campo": "cnpj",
      "extraido": "31.635.283/0001-71",
      "oficial": "31635283000171",
      "fornecido": null,
      "confere": true
    },
    {
      "campo": "razao_social",
      "extraido": "MANU MILHAS LTDA",
      "oficial": "MANU MILHAS LTDA",
      "fornecido": null,
      "confere": true
    },
    {
      "campo": "natureza_juridica",
      "extraido": null,
      "oficial": "Sociedade Empresária Limitada",
      "fornecido": null,
      "confere": null
    }
  ]
}
```

### Teste 3b — re-rodar após mudanças em `compare_document_fields.py`

Mudança do lado do agente (2026-07-25, `infrastructure/ai/langgraph/tools/compare_document_fields.py`):
comparação de `contrato_social` ganhou CNAE completo (principal +
secundárias, item a item), QSA por sócio (nome/qual/pais_origem/documento) e
telefone.

**Divergência a resolver antes de tipar:** o resumo da mudança usa exemplos
com `{ campo, resultado: "correto" | "divergencia" }`, mas o Teste 3 (rodado
contra a API real, antes dessa mudança) devolveu
`{ campo, extraido, oficial, fornecido, confere: boolean | null }`. Pode ser
só simplificação do resumo, ou o formato do item pode ter mudado de
verdade. **Preciso re-rodar o mesmo curl do Teste 3** contra o agente já com
essas mudanças deployadas pra confirmar o shape real antes de tipar
`AnaliseIaComparacaoCampo` — inclusive como fica a chave `campo` pros itens
de lista (string plana tipo `"qsa[0].nome"`, ou estrutura aninhada).

```bash
curl -s -X POST https://agents.flysakura.com/api/v1/agency-analysis/documents/analyze/sync \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: $AGENCY_ANALYSIS_API_KEY" \
  -d '{
    "internal_document_url": "gs://c2f-sakura-prod/doc-test/contrato_social_1777330703561.pdf",
    "document_type": "contrato_social",
    "channel": "api",
    "language": "pt-br",
    "include_official_data": true,
    "include_verdict": true
  }'
```

**Resposta (2026-07-25):** **shape confirmado — igual ao Teste 3.**
`comparacao_oficial` continua `{ campo, extraido, oficial, fornecido, confere }`;
o `"resultado": "correto"/"divergencia"` do resumo da mudança era só
simplificação ilustrativa do texto, não o formato real. **Ambiguidade
resolvida — pode tipar `AnaliseIaComparacaoCampo` (com `confere: boolean |
null`) com segurança, sem depender do Teste 4.**

Observação não-bloqueante: mesmo com as mudanças em
`compare_document_fields.py` (CNAE completo, QSA por sócio, telefone),
`comparacao_oficial` trouxe só `cnpj`/`razao_social`/`natureza_juridica` de
novo — nenhum item de CNAE/QSA/telefone apareceu, apesar de
`extracted_content.fields.qsa` ter vindo populado. Duas hipóteses (não
verificadas): (a) os dados oficiais desse CNPJ de teste não têm
CNAE/telefone/QSA cadastrados pra comparar (sem "oficial" não gera item), ou
(b) essa lógica nova vale só pro `stage3` do `/agency-analysis/sync` (nível
agência), não pro `comparacao_oficial` desse endpoint por documento. Não
bloqueia a implementação — `campo` é `string` genérico, funciona com
qualquer nome que apareça — mas vale confirmar com o time do agents depois.

Reconfirma também a não-determinância já registrada em
`agency-analysis-sync.md` (seção 7.4): campos como `capital_social`,
`objeto_social`, `tipo_documento` etc. vieram em `extra_fields` desta vez,
mas em `fields` (topo) no Teste 3 — mesmo documento, mesma chamada.

### Teste 4 — `/agency-analysis/sync` com campos extras no body final

Verifica se o schema do agente já aceita endereço/telefone/banco mesmo sem a
gente mandar hoje. Chamada isolada ao agents (não passa pelo nosso backend,
não gera contrato D4Sign nem grava nada no nosso banco).

```bash
curl -s -X POST https://agents.flysakura.com/api/v1/agency-analysis/sync \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: $AGENCY_ANALYSIS_API_KEY" \
  -d '{
    "cnpj": "62572350000180",
    "channel": "api",
    "language": "pt-br",
    "session_id": "teste-body-expandido",
    "analysis_data": {
      "cnpj": "62572350000180",
      "focus": "completo",
      "verificar_processos": false,
      "verificar_amat": false,
      "razao_social": "LARIAN GROUP LTDA",
      "email": "contato@empresa.com",
      "telefone": "+5511999999999",
      "endereco": {
        "cep": "04121-002",
        "logradouro": "Rua Santa Cruz",
        "numero": "2187",
        "bairro": "Vila Mariana",
        "municipio": "São Paulo",
        "uf": "SP"
      },
      "socios": []
    }
  }'
```

**Resposta (2026-07-25):**

```json
{
  "cnpj": "62572350000180",
  "focus": "completo",
  "stage1": {
    "description": "Verificação Cadastral — CNPJ, situação, CNAE, razão social, sócios e e-mail",
    "executed": true,
    "situacao_cadastral": "ATIVA",
    "cnae_principal": {
      "codigo": "6462000",
      "description": "Holdings de instituições não-financeiras",
      "compativel_turismo": false
    },
    "cnaes_secundarios": [],
    "razao_social": {
      "fornecido": "LARIAN GROUP LTDA",
      "oficial": "LARIAN GROUP LTDA",
      "confere": true
    },
    "nome_fantasia": { "fornecido": null, "oficial": "LARIAN GROUP", "confere": true },
    "email": { "fornecido": "contato@empresa.com", "has_mx": false, "corporativo": false },
    "socios": { "fornecidos": [], "oficiais": [], "divergencias": [] },
    "processos": { "verificado": false, "resumo": "Não verificado por solicitação do usuário." }
  },
  "stage2": null,
  "stage3": null,
  "parecer": "REPROVADO",
  "justificativa": "A análise foi interrompida: O CNAE principal 6462000 (Holdings de instituições não-financeiras) não é compatível com as atividades de turismo exigidas pela plataforma.",
  "flags_risco": ["CNAE incompatível com turismo", "Email não corporativo ou inexistente"],
  "receita_data": null
}
```

**Achados:**

1. **`telefone`/`endereco` que mandamos a mais no `analysis_data` não tiveram
   nenhum efeito observável** — não aparecem em nenhum lugar da resposta
   (nem um erro, nem uma comparação). O agente parece simplesmente ignorar
   campos que não reconhece no schema. **Conclusão: expandir o body com
   telefone/endereço hoje não tem efeito nenhum** — não vale implementar do
   nosso lado até o time do agents confirmar que o schema realmente vai
   processar esses campos. Item "Expandir o body" (seção 3) rebaixado de
   prioridade — virou pergunta pro time do agents, não trabalho nosso.

2. **CNAE incompatível com turismo é um gate que interrompe a análise cedo**
   — esse CNPJ de teste (LARIAN GROUP, CNAE 6462000) nunca chega no
   `stage2`/`stage3` (ambos `null`), então o teste ficou inconclusivo pra
   validar o efeito de qualquer coisa em estágios posteriores. `justificativa`
   já cai em `motivo` no nosso adapter (mapeamento existente, sem mudança
   necessária).

3. **Três campos novos em `stage1` que a API já devolve e nosso domínio
   (`AnaliseIaStage1`) não captura hoje:**
   - `email: { fornecido, has_mx, corporativo }` — validação estrutural do
     e-mail (não é comparação com "oficial", é MX + domínio corporativo).
   - `processos: { verificado, resumo }` — resultado da verificação de
     processos judiciais (`verificar_processos` no request).
   - `cnaes_secundarios: []` — mesma forma de `cnae_principal`, mas lista.

   Esses três já estão sendo descartados silenciosamente pelo
   `FlysakuraAnaliseIaAdapter` hoje (igual ao `parecer`/`comparacao_oficial`
   descoberto nos Testes 1–3b) — viram item de implementação junto com os
   outros, não é escopo novo, é o mesmo tipo de gap.

4. **Novo campo raiz `receita_data` (`null` aqui)** — shape desconhecido,
   nunca populado nos testes desta sessão (só ficou claro que existe).
   Pode ser candidato a substituir o "Dados da Receita" que hoje é montado
   à mão em `AnalisarCadastroUseCase` (stage1.situacaoCadastral + campos do
   contrato social) — mas sem ver populado, não dá pra confirmar. Não
   implementar agora; só anotado pra revisão futura.

5. **`stage2` continua com shape totalmente desconhecido** (`null` nos dois
   testes desta sessão, sempre interrompido antes de chegar lá). Não
   implementar/tipar até termos uma resposta real com `stage2` preenchido.

## 5. Decisões em aberto

- Ordem de implementação combinada: (1) rodar os testes acima, (2)
  `include_official_data`/`include_verdict`/`additional_data` no domínio,
  (3) expandir body do `/agency-analysis/sync`. Auto-atualização (Zustand) e
  atualização dos docs antigos ficam pra depois desses três.
