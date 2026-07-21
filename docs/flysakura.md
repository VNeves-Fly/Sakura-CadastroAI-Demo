# Agente de análise de IA (agents.flysakura.com)

**Arquivos:**

- `src/modules/cadastro/infrastructure/adapters/flysakura-document-analysis.adapter.ts` — por documento, `POST /documents/analyze/sync`.
- `src/modules/cadastro/infrastructure/adapters/flysakura-analise-ia.adapter.ts` — avaliação final, `POST /agency-analysis/json`.

**Ativados quando:** `AGENCY_ANALYSIS_API_KEY` está definida (senão cai pros mocks — `MockDocumentAnalysisService` sempre devolve resultado vazio; `MockAnaliseIaService` só valida checksum do CNPJ).

**Docs oficiais:** OpenAPI real em `https://agents.flysakura.com/openapi.json` (o `/redoc` é só a UI renderizada em cima desse spec).

Autenticação: header `X-Internal-Secret` em ambos (confirmado no `securitySchemes` do spec oficial — não é `Authorization`).

## Fluxo

1. **Passo 1 do wizard** (`AnalisarContratoSocialUseCase`) — assim que CNPJ + contrato social estão presentes, sobe o arquivo e chama `documentAnalysisService.analisar({ documentType: "contrato_social" })`. Preview, best-effort — não bloqueia o preenchimento do formulário.
2. **Submissão final** (`FinalizarCadastroUseCase`) — reprocessa o contrato social e, para cada sócio, chama `documentAnalysisService.analisar({ documentType: "doc_identificacao" })` para o RG/CNH. Sequencial (não `Promise.all`): as chamadas dividem o mesmo `session_id` (= CNPJ) no agente.
3. Os resultados de cada extração (`camposExtraidos`/`confidence_score`/`alertas`) são passados para `analiseIaService.avaliar()`, que monta o `analysis_data` e chama `/agency-analysis/json` — o agente **não reprocessa os documentos**, só cruza os campos já extraídos contra o CNPJ oficial.

## Request — `/documents/analyze/sync` (por documento)

```json
{
  "internal_document_url": "gs://<GCS_BUCKET_NAME>/cadastro-ai/agencias/<cnpj>/socio-0-rg.pdf",
  "document_type": "doc_identificacao",
  "session_id": "<cnpj>",
  "channel": "api"
}
```

`internal_document_url` (não uma signed URL) — o agents-service já tem IAM direto no bucket compartilhado.

## Request — `/agency-analysis/json` (avaliação final)

```json
{
  "cnpj": "19131243000197",
  "channel": "api",
  "language": "pt-br",
  "session_id": "19131243000197",
  "analysis_data": {
    "cnpj": "19131243000197",
    "focus": "completo",
    "verificar_processos": false,
    "verificar_amat": false,
    "razao_social": "Agência Teste",
    "email": "contato@agenciateste.com",
    "socios": [
      {
        "nome": "Fulano de Tal",
        "documento_identificacao": "39053344705",
        "data_nascimento": "1990-04-12",
        "documentos": [
          {
            "internal_document_url": "gs://.../socio-0-rg.pdf",
            "document_type": "doc_identificacao",
            "campos_extraidos": { "nome": "Fulano de Tal", "cpf": "390.533.447-05" },
            "confidence_score": 0.97,
            "alertas": []
          }
        ]
      }
    ]
  }
}
```

`documento_identificacao` é CPF (ou RNE/RNM pra sócio estrangeiro) — o nome do campo mudou de `cpf` numa revisão do contrato (2026-07-20). `data_nascimento` (ISO `YYYY-MM-DD`, campo novo no card do sócio) é cruzado pelo agente contra a data de nascimento extraída do RG/CNH. `campos_extraidos`/`confidence_score`/`alertas` vêm exatamente do que `/documents/analyze/sync` já retornou — o adapter não reextrai nada.

**Ainda não coletado pelo wizard:** `analysis_data.documentos`/comprovante de endereço do sócio (cadastur/IATA/comprovante — o wizard não coleta esses documentos ainda).

**contrato_social não entra em `documentos`** — sua validação é resolvida inteiramente dentro do próprio `/documents/analyze`; só alimenta `razao_social`/`email`/`cnpj` (e esses, na verdade, vêm da consulta QSA/formulário, não do OCR do contrato).

## Resposta (`AgencyAnalysisJsonResponse`)

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

## Comportamento em falha

Se a chamada a `analiseIaService.avaliar()` falhar, o adapter lança um `Error` que **não é capturado** em `FinalizarCadastroUseCase` — o cadastro inteiro falha com `500`, nada é persistido. Diferente do QSA (que trata falha como "sem dado" e segue o fluxo), a análise de IA não tem fallback — uma instabilidade passageira no serviço deles derruba a submissão inteira do usuário. Ainda não implementado (discutido, não decidido): tratar falha da IA como "manda pra revisão manual" em vez de erro fatal.
