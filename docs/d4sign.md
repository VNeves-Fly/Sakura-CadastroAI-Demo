# D4Sign — geração e envio de contrato pra assinatura

**Arquivo:** `src/modules/cadastro/infrastructure/adapters/d4sign.adapter.ts`
**Ativado quando:** `D4SIGN_TOKEN_API` está definida (senão cai pro `MockD4SignService`).
**Docs oficiais:** `https://docapi.d4sign.com.br/` (spec OpenAPI real em `https://docapi.d4sign.com.br/llms.txt`)

**⚠️ Atenção:** as credenciais em uso são de **produção** (`secure.d4sign.com.br`), não sandbox — testado ao vivo, o token só respondeu na base de produção, apesar do nome `D4SIGN_SANDBOX` na env original. `D4SIGN_API_BASE_URL` está setada explicitamente pra `https://secure.d4sign.com.br/api/v1`.

Autenticação em toda chamada: query string `?tokenAPI=...&cryptKey=...` (não é header).

## 1. Listar templates — `POST /templates`

Usado uma vez, manualmente, pra descobrir as variáveis reais do template configurado (`D4SIGN_TEMPLATE_ID`). Não faz parte do fluxo automático do adapter.

**Request:** `POST https://secure.d4sign.com.br/api/v1/templates?tokenAPI=...&cryptKey=...`

**Response — `200 OK`** (lista completa, recortada aqui pro template em uso):

```json
{
  "2": {
    "id": "MjE5OTI0",
    "name": "Contrato Sakura - Geral.docx",
    "type": "word",
    "variables": {
      "tokens_gerais": [
        "razaosocial",
        "cnpj",
        "cidade",
        "estado",
        "endereco",
        "n",
        "complemento",
        "bairro",
        "cep",
        "indicacao",
        "socios"
      ]
    }
  }
}
```

(a conta tem outros 9 templates cadastrados — sócios em conjunto, freelancer, código de ética etc. — não usados neste fluxo)

## 2. Criar documento a partir do template — `POST /documents/{uuid-safe}/makedocumentbytemplateword`

**Request:**

```
POST https://secure.d4sign.com.br/api/v1/documents/9baf9199-0d3b-4f12-8e4b-20ee2d43946c/makedocumentbytemplateword?tokenAPI=...&cryptKey=...
Content-Type: application/json
```

```json
{
  "name_document": "Contrato Sakura - Agência Teste Claude (ignorar)",
  "templates": {
    "MjE5OTI0": {
      "razaosocial": "Agência Teste Claude (ignorar)",
      "cnpj": "19131243000197",
      "cidade": "São Paulo",
      "estado": "SP",
      "endereco": "Avenida Paulista",
      "n": "1000",
      "complemento": "",
      "bairro": "Bela Vista",
      "cep": "01310100",
      "indicacao": "teste-integracao",
      "socios": "Lucas Monte (teste) (CPF: 39053344705)"
    }
  }
}
```

**Response — `200 OK`:**

```json
{ "uuid": "e39ec472-8017-458d-ad74-fff3804f267b" }
```

Segundo teste, mesmo template, signatário diferente (nome/e-mail reais mascarados aqui): `{ "uuid": "3b7bcc57-462f-433b-a7e4-34e67c43e48a" }` — mesmo status 200.

## 3. Confirmar o documento gerado — `GET /documents/{uuid}`

**Request:** `GET https://secure.d4sign.com.br/api/v1/documents/e39ec472-8017-458d-ad74-fff3804f267b?tokenAPI=...&cryptKey=...`

**Response — `200 OK`:**

```json
[
  {
    "uuidDoc": "e39ec472-8017-458d-ad74-fff3804f267b",
    "nameDoc": "Contrato Sakura - Agência Teste Claude  ignorar ",
    "type": "application/pdf",
    "size": "61985",
    "pages": "16",
    "uuidSafe": "9baf9199-0d3b-4f12-8e4b-20ee2d43946c",
    "safeName": "Sakura APP",
    "statusId": "3",
    "statusName": "Aguardando Assinaturas",
    "statusComment": null,
    "whoCanceled": null
  }
]
```

PDF real de 16 páginas gerado a partir do template Word com as variáveis substituídas — confirma que a substituição de tokens funcionou.

## 4. Registrar webhook no documento — `POST /documents/{uuid}/webhooks`

Só roda se `D4SIGN_WEBHOOK_URL` estiver configurada — hoje está vazia (sem domínio público em dev), então esse passo é **pulado** no adapter. Formato da chamada (não exercida em teste real, sem URL pública disponível):

```json
{ "url": "https://seu-dominio.com/api/webhooks/d4sign" }
```

## 5. Cadastrar signatário — `POST /documents/{uuid}/createlist`

**Request** (e-mail real do signatário mascarado aqui por privacidade — testado de verdade duas vezes, com dois signatários reais diferentes, na versão sem estágios/`after_position` do adapter):

```json
{
  "signers": [
    {
      "email": "signatario@exemplo.com",
      "act": "1",
      "foreign": "0",
      "certificadoicpbr": "0",
      "assinatura_presencial": "0"
    }
  ]
}
```

**Response:** `200 OK` (corpo não logado pelo adapter — só `response.ok` é checado; a doc oficial mostra um retorno com `key_signer`, `status: "created"`, etc.)

### 5.1 Estágios de assinatura (`after_position`) — não testado ao vivo ainda

O adapter agora monta a lista com **todos** os signatários de uma vez (sócios + os 4 fixos da Sakura, lidos de `signatarios_padrao` via `SignatarioPadraoRepository`), cada um com `after_position` = seu estágio. Confirmado na doc oficial (`docs/endpoints-1.md`): "Define a posição após a qual o signatário será inserido na ordem".

| Estágio (`after_position`) | Quem                                              | `act`                                           |
| -------------------------- | ------------------------------------------------- | ----------------------------------------------- |
| `"0"`                      | Sócios da agência (dinâmico, `input.signatarios`) | `"1"` (assinar)                                 |
| `"1"`                      | Jean — `cadastro@sakuratur.com.br`                | `"2"` (aprovar)                                 |
| `"2"`                      | Vivi, Wagner, Jennifer                            | `"4"` (assinar como parte) / `"5"` (testemunha) |

```json
{
  "signers": [
    {
      "email": "socio@agencia.com",
      "act": "1",
      "foreign": "0",
      "certificadoicpbr": "0",
      "assinatura_presencial": "0",
      "after_position": "0"
    },
    {
      "email": "cadastro@sakuratur.com.br",
      "act": "2",
      "foreign": "0",
      "certificadoicpbr": "0",
      "assinatura_presencial": "0",
      "after_position": "1"
    },
    {
      "email": "vivi.siqueira@sakuratur.com.br",
      "act": "4",
      "foreign": "0",
      "certificadoicpbr": "0",
      "assinatura_presencial": "0",
      "after_position": "2"
    },
    {
      "email": "wagner.chaves@sakuratur.com.br",
      "act": "5",
      "foreign": "0",
      "certificadoicpbr": "0",
      "assinatura_presencial": "0",
      "after_position": "2"
    },
    {
      "email": "jennifer.araujo@sakuratur.com.br",
      "act": "5",
      "foreign": "0",
      "certificadoicpbr": "0",
      "assinatura_presencial": "0",
      "after_position": "2"
    }
  ]
}
```

**⚠️ Ainda não exercido contra a conta real** — só coberto por teste unitário (fetch mockado). O `act` de cada signatário fixo vem do enum `PapelSignatarioPadrao` (schema.prisma), traduzido em `ACT_POR_PAPEL` no adapter.

## 6. Enviar pra assinatura — `POST /documents/{uuid}/sendtosigner`

**Request:**

```json
{ "skip_email": "0", "workflow": "1" }
```

`skip_email: "0"` → manda e-mail de notificação de verdade pro signatário. `workflow: "1"` → respeita a ordem de `after_position`: o D4Sign só notifica o próximo estágio depois que todos do estágio anterior assinarem (confirmado em `docs/endpoints-2.md`: "o segundo signatário só receberá a mensagem [...] DEPOIS que o primeiro signatário efetuar a assinatura").

**Response:** `200 OK` (corpo não logado pelo adapter).

**Confirmado no teste (ao vivo, ainda na versão `workflow: "0"`):** e-mail de convite pra assinar foi enviado de verdade pro signatário de teste (2 vezes, com pessoas/e-mails diferentes) — documento passou pro status "Aguardando Assinaturas" (visto na chamada 3 acima). **A versão com `workflow: "1"` + estágios ainda não foi testada contra a conta real** — só unitário, pra não dar sinal de assinatura pros 4 signatários fixos (Jean/Vivi/Wagner/Jennifer) de verdade num teste.

## 7. Cancelar documento de teste — `POST /documents/{uuid}/cancel`

Usado só pra limpar os testes acima (não faz parte do fluxo do adapter).

**Request:**

```json
{ "comment": "Documento de teste de integração — pode ignorar/cancelar" }
```

**Response — `200 OK`:**

```json
[
  {
    "uuidDoc": "e39ec472-8017-458d-ad74-fff3804f267b",
    "nameDoc": "Contrato Sakura - Agência Teste Claude  ignorar ",
    "statusId": 6,
    "statusName": "Cancelado",
    "statusComment": "Documento de teste de integração — pode ignorar/cancelar",
    "whoCanceled": null
  }
]
```

## 8. Webhook recebido — `POST /api/webhooks/d4sign` (rota nossa)

D4Sign manda o webhook em **form-data**, não JSON (confirmado na doc oficial). Como não temos URL pública em dev, testamos a rota com payloads sintéticos idênticos ao formato documentado, contra um registro de teste no banco.

**Teste A — documento finalizado (`type_post=1`):**

Request (form-data): `uuid=webhook-test-uuid-123`, `type_post=1`, `message=Finished document`

Response — `200 OK`:

```json
{ "processado": true }
```

Efeito real confirmado no banco: `contrato.status` → `assinado`, `agencia.status` → `aguardando_validacao`.

**Teste B — evento não tratado (`type_post=2`, e-mail não entregue):**

Response — `200 OK`:

```json
{ "processado": false, "motivo": "typePost \"2\" reconhecido, sem ação." }
```

**Teste C — `provedorId` desconhecido:**

Request: `uuid=nao-existe-123`, `type_post=1`

Response — `200 OK`:

```json
{ "processado": false, "motivo": "Contrato não encontrado pra esse provedorId." }
```

**Teste D — payload inválido (sem `uuid`):**

Response — `422 Unprocessable Entity`:

```json
{ "error": "Payload de webhook inválido — uuid e type_post são obrigatórios." }
```

### Segurança do webhook (HMAC)

Se `D4SIGN_WEBHOOK_SECRET` estiver configurada, a rota valida o header `Content-Hmac: sha256=<hash>` (HMAC-SHA256 do `uuid` do documento com a secret). Sem essa variável, aceita qualquer payload sem validar origem — documentado no código, não testado ao vivo (não temos a Secret Key MAC gerada na conta ainda).
