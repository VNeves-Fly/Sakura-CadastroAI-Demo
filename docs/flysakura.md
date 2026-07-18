# Agente de análise de IA (agents.flysakura.com)

**Arquivo:** `src/modules/cadastro/infrastructure/adapters/flysakura-analise-ia.adapter.ts`
**Ativado quando:** `AGENCY_ANALYSIS_API_KEY` está definida (senão cai pro `MockAnaliseIaService`, que só valida checksum do CNPJ).
**Docs oficiais:** OpenAPI real em `https://agents.flysakura.com/openapi.json` (o `/redoc` é só a UI renderizada em cima desse spec).

Endpoint usado: `POST /api/v1/agency-analysis/json` — não o `POST /api/v1/agency-analysis/` genérico, porque só o `/json` força `channel="api"` e garante resposta tipada (`parecer`/`justificativa`/`flags_risco`); o genérico responde em formato de chat.

Autenticação: header `X-Internal-Secret` (confirmado no `securitySchemes` do spec oficial — não é `Authorization`).

## Request — formato real montado pelo adapter

```
POST https://agents.flysakura.com/api/v1/agency-analysis/json
Content-Type: application/json
X-Internal-Secret: <AGENCY_ANALYSIS_API_KEY>
```

```json
{
  "cnpj": "19131243000197",
  "company_name": "Open Knowledge Brasil",
  "partners": [
    {
      "name": "Sócio de Teste",
      "document": "39053344705",
      "attachments": [
        "https://storage.googleapis.com/c2f-sakura-homolog/cadastro-ai/agencias/.../socio-0-rg-....pdf?X-Goog-Signature=...",
        "https://storage.googleapis.com/c2f-sakura-homolog/cadastro-ai/agencias/.../socio-0-procuracao-....pdf?X-Goog-Signature=..."
      ]
    }
  ],
  "documents": [
    "https://storage.googleapis.com/c2f-sakura-homolog/cadastro-ai/agencias/.../contrato-social-....pdf?X-Goog-Signature=..."
  ],
  "analysis_data": { "cnpj": "19131243000197", "focus": "completo" },
  "include_receita_data": false,
  "raw": false
}
```

As URLs de `attachments`/`documents` são assinadas pelo próprio adapter via GCS (`getSignedUrl`, 15min de validade) antes de montar essa request — ver `docs/gcs.md`.

## Teste 1 — submissão real via wizard, sessão anterior (CNPJ `19131243000197`, sócio fictício)

Corpo bruto da resposta não foi capturado nesse teste (só o efeito observado). **Resultado mapeado:** `parecer` não-aprovado → `AnaliseIaResultado.aprovado = false` → agência persistida com `status: "em_complementar"`, sem `Contrato` criado. Confirmado consultando o banco depois da chamada.

## Teste 2 — chamada mínima direta (sem documentos), depois de uma instabilidade percebida

**Request:**

```json
{
  "cnpj": "19131243000197",
  "company_name": "Teste",
  "analysis_data": { "cnpj": "19131243000197", "focus": "completo" },
  "include_receita_data": false,
  "raw": false
}
```

**Response — `500 Internal Server Error`:**

```json
{ "detail": "agent_execution_failed" }
```

Repetido 3 vezes (dois CNPJs diferentes, incluindo um `curl` direto sem passar pelo nosso código nenhum) — mesmo erro toda vez, confirmando que é uma falha do **lado deles** no momento do teste, não do nosso adapter/payload.

## Mapeamento de resposta (quando o serviço responde OK)

Segundo o schema oficial (`AgencyAnalysisJsonResponse`):

```json
{
  "cnpj": "string",
  "parecer": "APROVADO", // ou "PENDENTE" ou "REPROVADO" ou null
  "justificativa": "string",
  "flags_risco": ["string"],
  "stage1": { "...": "..." },
  "stage2": { "...": "..." },
  "stage3": { "...": "..." }
}
```

Nosso adapter mapeia:

- `parecer === "APROVADO"` → `aprovado: true`, `motivo: null`
- qualquer outro valor (`PENDENTE`, `REPROVADO`, `null`) → `aprovado: false`, `motivo: justificativa`

## Comportamento em falha (achado desta sessão)

Hoje, se essa chamada falhar (como no Teste 2), o adapter lança um `Error` que **não é capturado** em `FinalizarCadastroUseCase` — o cadastro inteiro falha com `500`, nada é persistido. Diferente do QSA (que trata falha como "sem dado" e segue o fluxo), a análise de IA não tem fallback — uma instabilidade passageira no serviço deles derruba a submissão inteira do usuário. Ainda não implementado (discutido, não decidido): tratar falha da IA como "manda pra revisão manual" em vez de erro fatal.
