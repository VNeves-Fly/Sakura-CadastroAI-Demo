# Migração `/agency-analysis/json` → `/agency-analysis/sync`

Registro do que foi alterado no CadastroAI para acompanhar a padronização de
paths do agents-service (grupo `agency-analysis` alinhado ao mesmo padrão
`sync`/`async`/`stream` já usado em `/documents/analyze`). Mesmo body, mesma
resposta tipada — só o path do endpoint final mudou, mas a resposta ganhou um
campo (`stage3`) que antes era ignorado.

**Branch:** `feature/analyze` · **Data:** 2026-07-21

## 1. O que mudou

| Antes                                                                                    | Depois                                                      |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `POST /api/v1/agency-analysis/json`                                                      | `POST /api/v1/agency-analysis/sync`                         |
| Resposta: `stage3` recebida mas descartada                                               | `stage3` mapeado para `AnaliseIaResultado.detalhamento`     |
| Veredito final (`parecer`/`motivo`/`flagsRisco`) só existia em memória durante a request | Persistido em `analises_ia_agencias`, uma linha por agência |

Não houve mudança de shape no request nem nos campos já existentes da
resposta (`parecer`, `justificativa`, `flags_risco`) — só a adição do
processamento de `stage3`, que a API já mandava mas o adapter ignorava.

## 2. Arquivos alterados

- `src/modules/cadastro/infrastructure/adapters/flysakura-analise-ia.adapter.ts`
  - URL: `/api/v1/agency-analysis/json` → `/api/v1/agency-analysis/sync`.
  - Novo parsing de `stage3` (`documentos_empresa[]`, `socios[].documentos[]`) da resposta, mapeado para `AnaliseIaResultado.detalhamento`.
- `src/modules/cadastro/domain/services/analise-ia-service.ts`
  - Novos tipos: `AnaliseIaComparacaoCampo`, `AnaliseIaDocumentoDetalhe`, `AnaliseIaSocioDetalhe`, `AnaliseIaDetalhamento`.
  - `AnaliseIaResultado` ganhou o campo opcional `detalhamento?: AnaliseIaDetalhamento | null`.
- `prisma/schema.prisma`
  - Novo model `AnaliseIaAgencia` (relação 1-1 com `Agencia`).
- `prisma/migrations/20260721173635_add_analise_ia_agencia/migration.sql`
  - Cria a tabela `analises_ia_agencias`.
- `src/modules/cadastro/domain/repositories/agencia-repository.ts`
  - `CreateAgenciaData` ganhou o campo `analiseIaFinal: AnaliseIaResultado | null`.
- `src/modules/cadastro/application/use-cases/finalizar-cadastro.use-case.ts`
  - Passa o resultado de `analiseIaService.avaliar()` como `analiseIaFinal` ao chamar `agenciaRepository.create()`.
- `src/modules/cadastro/infrastructure/repositories/prisma-agencia.repository.ts`
  - Novo helper `analiseIaFinalParaPrisma()`.
  - `create()` grava `AnaliseIaAgencia` na mesma transação (junto com `Agencia`, sócios, documentos e `Contrato`).
- `__tests__/modules/cadastro/infrastructure/adapters/flysakura-analise-ia.adapter.test.ts`
  - Testes existentes atualizados para o novo path e para o campo `detalhamento: null`.
  - Novo teste cobrindo o mapeamento de `stage3` → `detalhamento`.

## 3. Novo model Prisma — `AnaliseIaAgencia`

```prisma
model AnaliseIaAgencia {
  id        String  @id @default(cuid())
  agenciaId String  @unique
  agencia   Agencia @relation(fields: [agenciaId], references: [id], onDelete: Cascade)

  parecer      String?
  motivo       String?
  flagsRisco   String[]
  detalhamento Json?

  avaliadoEm DateTime @default(now())

  @@map("analises_ia_agencias")
}
```

Guarda o veredito final do `/agency-analysis/sync` — antes esse resultado só
existia em memória durante a request (usado pra decidir `status`/gerar
contrato) e era descartado; agora fica persistido pra dar contexto real ao
analista quando o parecer não é `APROVADO`, em vez de só o status
`em_complementar` sem explicação. `detalhamento` guarda o `stage3` bruto
(campo a campo: `extraido`/`oficial`/`fornecido`/`confere`).

## 4. Mapeamento request/response (nomenclatura)

O nome do campo muda entre o que se envia e o que se recebe — vale atenção:

- Request envia `document_type` por documento.
- Response devolve `tipo` (não `document_type`) dentro de `stage3`.
- Request envia `alertas` (por documento, vindo da etapa de `/documents/analyze/sync`).
- Response devolve `alertas_extracao` dentro de cada bloco de `stage3` — mapeado para `alertasExtracao` no domínio.

## 5. O que NÃO foi implementado (fora do escopo desta mudança)

Decisão consciente, para manter o blast radius pequeno — ver conversa que
originou esta mudança:

- **Documentos de nível empresa** (`analysis_data.documentos[]`: cadastur, IATA, comprovante de endereço da agência): exigiria novo tipo de upload no wizard, novo campo no `FinalizarCadastroInput`/rota, e nova chamada a `documentAnalysisService.analisar()` por tipo. O schema já tem os enums (`TipoDocumento.CADASTUR`, `COMPROVANTE_ENDERECO`) mas seguem como roadmap, não populados.
- **Flags `include_verdict`/`include_official_data`** em `/documents/analyze/sync`: dariam veredito/comparação oficial imediata por documento nas rotas de preview (`analisar-contrato-social`, `analisar-documento-identificacao`), sem custo de LLM extra. Não implementado.
- **Exposição do `detalhamento` para o analista**: o campo é persistido em `analises_ia_agencias`, mas não é lido de volta em `AgenciaDetalhe` nem exibido em nenhuma tela — hoje só existe no banco, pronto pra um passo futuro de leitura/UI.
- `docs/flysakura.md` (doc de referência existente) **ainda cita `/agency-analysis/json`** e o payload de resposta sem o mapeamento de `stage3` — não foi atualizado neste trabalho, só este arquivo novo.

## 6. Verificação feita

- `bunx prisma migrate status` → banco em dia após a nova migration.
- `bun run typecheck`, `bun run lint`, `bun run test` → sem erros; suíte completa (168 testes) passando.
- Testado manualmente contra os serviços reais (agents.flysakura.com + GCS), via `bun run dev`:
  - `POST /api/cadastro/documentos/contrato-social` com `docs/dev-files/contrato_social_1776962964018.pdf` → sócios, razão social, capital social e endereço extraídos corretamente (confiança 0.98).
  - `POST /api/cadastro/documentos/identificacao` com `docs/dev-files/rg_cnpj_bruno__1776962964019.pdf` → nome, CPF e data de nascimento extraídos corretamente (confiança 0.99), nome batendo com o sócio do contrato social.
- **Não testado**: o fluxo completo (`POST /api/cadastro/agencia`), que é o único caminho que de fato chama `/agency-analysis/sync` — evitado porque, se a IA aprovasse, geraria e enviaria um contrato real via D4Sign **produção** (credenciais do `.env` local são de produção, não sandbox).

## 7. Sessão de teste end-to-end (2026-07-21, pós-migração)

Numa sessão seguinte, o fluxo completo (`POST /api/cadastro/agencia`) foi finalmente
testado contra os serviços reais — com consentimento explícito do usuário sobre o
risco de D4Sign produção (ver "Blast radius do D4Sign" abaixo). Migrations já
estavam em dia (9 migrations, incluindo a `add_analise_ia_agencia` desta doc).

### 7.1. O que funcionou sem alteração de código

- `POST /api/cadastro/documentos/contrato-social` com
  `docs/dev-files/contrato_social_1776962964018.pdf` → CNPJ 62.572.350/0001-80
  (LARIAN GROUP LTDA), sócio Bruno Henrique Nascimento Bazoti, capital social,
  endereço — confiança 0.99.
- `POST /api/cadastro/documentos/identificacao` com
  `docs/dev-files/rg_cnpj_bruno__1776962964019.pdf` → nome, CPF e data de
  nascimento batendo com o sócio do contrato social — confiança 0.99.
- 129 testes (depois 128, após ajuste da suíte — ver 7.3), `tsc --noEmit` e
  `eslint` seguiram limpos durante toda a investigação.

### 7.2. Blast radius do D4Sign (achado de investigação, não é bug)

O fluxo completo, se a IA aprovar, chama `contratoAssinaturaService.gerarEEnviar()`
**antes** de `agenciaRepository.create()` — ou seja, se o D4Sign for chamado com
sucesso e a persistência falhar depois, o e-mail de assinatura já foi enviado
mesmo sem nada gravado no banco. Além disso, `D4SignAdapter.cadastrarSignatarios()`
adiciona automaticamente os `signatario_padrao` ativos (hoje: Jean, Vivi Siqueira,
Wagner Chaves, Jennifer Araujo, todos `@sakuratur.com.br`) como signatários fixos
em **todo** contrato gerado, além do(s) sócio(s) informado(s) no cadastro — não é
possível gerar um contrato de teste sem, em tese, notificar essas pessoas.
Confirmado por consulta direta à API do D4Sign (`GET /documents/{safeUuid}/safe`)
que nenhum documento chegou a ser criado nos testes desta sessão — a falha
descrita em 7.3 acontece antes do passo de D4Sign.

### 7.3. Bug encontrado e corrigido — `document_type` e `internal_document_url` no `/agency-analysis/sync`

O primeiro teste do fluxo completo falhou com `500 agent_execution_failed` vindo
do próprio agente. Investigação por captura direta do body enviado (instrumentação
temporária, revertida depois) revelou dois problemas reais no payload de
`analysis_data.socios[].documentos[]`:

1. **`internal_document_url` sobrando** — o payload incluía essa URL (`gs://...`)
   em cada documento, mas essa etapa (avaliação final) não reprocessa o arquivo,
   só cruza campos já extraídos pela etapa 3. Campo removido.
2. **`document_type` mal escolhido** — a primeira tentativa de correção trocou o
   valor fixo `"doc_identificacao"` por `"rg"`/`"cnh"` inferido de
   `campos_extraidos.tipo_documento_identificado`. Essa troca **piorou o
   problema**: o schema oficial (`DOCUMENT_SCHEMAS`, fornecido pelo usuário)
   define `DocumentType.DOC_IDENTIFICACAO` como um tipo de primeira classe,
   pensado exatamente para o caso do wizard (mesmo slot de upload pra RG ou CNH,
   sem pré-classificação) — o agente é quem identifica o tipo real via
   `tipo_documento_identificado`. Mandar `"cnh"`/`"rg"` com os campos extraídos
   no formato do schema `doc_identificacao` (que não teve `rg`/`orgao_emissor`/
   `categoria`/`data_validade` como campos de topo, só em `extra_fields`) criava
   um descompasso entre o `document_type` declarado e o shape real dos campos.

   **Correção final:** `document_type` volta a ser sempre `"doc_identificacao"`
   (fixo), sem tentar inferir RG/CNH.

Arquivo: `src/modules/cadastro/infrastructure/adapters/flysakura-analise-ia.adapter.ts`.
Também removida a função `requireBucketName()` (ficou morta — `GCS_BUCKET_NAME`
não é mais necessária _nesse_ adapter, só no `flysakura-document-analysis.adapter.ts`)
e o teste correspondente em `__tests__/.../flysakura-analise-ia.adapter.test.ts`
que exigia essa env var.

### 7.4. `agent_execution_failed` persiste mesmo com o payload corrigido

Depois da correção (7.3), o payload capturado ao vivo bate exatamente com o
schema documentado — mas a chamada real ao `/agency-analysis/sync` **continuou
falhando** com o mesmo `500 agent_execution_failed`, testado em 3 variações:

- CNPJ real (62.572.350/0001-80) com razão social oficial via QSA.
- CNPJ fictício nunca usado antes (44.556.677/0001-99) — descarta a hipótese de
  `session_id` "envenenado" por reuso em tentativas anteriores.
- Reparo adicional: a etapa 3 (`/documents/analyze/sync`) não é totalmente
  determinística — em uma chamada `rg`/`orgao_emissor`/`categoria`/`data_validade`
  vieram em `extra_fields`, em outra vieram dentro de `fields`, pro mesmo
  documento.

Como o erro é idêntico independente de CNPJ, sessão e riqueza dos dados, e o
payload já bate com a spec, a causa provável está do lado do agente
(`agents.flysakura.com`), não no que mandamos. **Ainda não resolvido** — recomenda-se
reportar ao time do Flysakura com o payload de 7.3 como reprodução.

Confirmado que nenhuma das tentativas de teste desta sessão deixou dado
persistido no banco (nenhuma linha nova em `agencias` para os CNPJs de teste
usados) nem gerou documento no D4Sign (ver 7.2).
