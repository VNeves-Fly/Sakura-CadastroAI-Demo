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

### 5.0 Evidência extra dos sócios — selfie com documento + vídeo selfie

Requisito de negócio: quando o documento vai pros sócios (estágio 0), exigir **2 evidências** de identidade além da assinatura em si — confirmado nos campos documentados oficialmente pra `createlist` (`docs/endpoints-1`):

- `docauthandselfie: "1"` — exige selfie segurando o documento.
- `videoselfie: "1"` — exige vídeo selfie.

Só os sócios (`ESTAGIO_SOCIOS`) recebem esses dois campos — os 4 signatários fixos da Sakura (Jean/Vivi/Wagner/Jennifer) não. **Ainda não exercido contra a conta real** — só coberto por teste unitário; falta confirmar ao vivo como o D4Sign expõe essas evidências pro analista revisar depois (painel deles, ou algum campo retornado no `GET /documents/{uuid}`/webhook).

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

## 6.1 Baixar o PDF pra pré-visualização — `POST /documents/{uuid}/download`

Usado por `D4SignAdapter.visualizarDocumento` (botão "Visualizar Documento" do contrato no dossiê, `VisualizarDocumento` com prop `url`).

**⚠️ Bug encontrado (não pela doc oficial do D4Sign, que não documenta o schema da resposta — só pelo SDK PHP oficial, `d4sign/d4sign-php`, método `getfileurl`/README "Realizar o DOWNLOAD de um documento"):** esse endpoint **não devolve os bytes do PDF**. A resposta é `application/json` com um link temporário pro arquivo real:

```php
$url_final = $client->documents->getfileurl('{UUID-DOCUMENT}', 'zip');
$arquivo = file_get_contents($url_final->url); // segundo request, arquivo de verdade
```

A implementação original tratava a resposta como bytes crus (`response.arrayBuffer()` direto), então o "PDF" servido pro `<iframe>` era o texto do JSON (`{"url":"...","name":"..."}`) com `Content-Type: application/pdf` — daí o modal abrir vazio/quebrado. Corrigido pra fazer os dois fetches: `POST /download` pra pegar `{ url }`, depois `GET` nesse `url` pra pegar o PDF de verdade.

`encoding: false` no corpo pede o PDF cru (a doc oficial, `docapi.d4sign.com.br/reference/download-de-um-documento`, documenta `encoding` como boolean — `true` devolveria um link pra um `.txt` em base64 em vez do PDF).

**Ainda não exercido contra a conta real após o fix** — corrigido só a partir da doc oficial + SDK, não confirmado ao vivo ainda.

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

D4Sign manda o webhook em **form-data**, não JSON, na doc oficial genérica (formato 1.0). Como não temos URL pública em dev, testamos a rota com payloads sintéticos idênticos ao formato documentado, contra um registro de teste no banco.

**A conta em uso está com "Webhook 2.0" ativado e Content-Type configurado como JSON** (confirmado no painel D4Sign, 2026-07-28) — não o form-data 1.0 acima. O JSON do 2.0 não é tão plano quanto o form-data: `email` do signatário vem aninhado em `signer.email` pros eventos `type_post` "2"/"4" (`signers[]`, lista, no "1" — não usado hoje), e o motivo de falha de e-mail (típo "2") vem estruturado em `error_details.{category,reason,smtp_code,diagnostic_message}`, não em `message` (que ali é só um rótulo fixo, "E-mail not sent"). Exemplos completos: `docapi.d4sign.com.br/docs/webhook-postback#retornos-enviados-para-a-sua-url-via-post-webhook-versão-20`. `webhook-d4sign.routes.ts` (`extrairCamposJson`) já trata esse aninhamento; `extrairCamposFormData` continua no formato 1.0 plano documentado abaixo, usado só como fallback quando o Content-Type recebido não é JSON. `type_post` também é aceito como number além de string (o parser de form-data só produz string, mas nada garante que o JSON sempre sirva string).

**Teste A — documento finalizado (`type_post=1`):**

Request (form-data): `uuid=webhook-test-uuid-123`, `type_post=1`, `message=Finished document`

Response — `200 OK`:

```json
{ "processado": true }
```

Efeito real confirmado no banco: `contrato.status` → `assinado`, `agencia.status` → `aguardando_validacao`.

### 8.1 Assinatura individual (`type_post=4`) — não testado ao vivo ainda

Confirmado na doc oficial (`docs/webhook-postback.md`): `type_post=4` = assinatura de **um** signatário específico, com o campo `email` identificando quem foi (a rota agora lê esse campo — `webhook-d4sign.routes.ts`).

Três efeitos possíveis na mesma execução (mudou em 2026-07-30 — antes só o aprovador disparava o avanço da agência, o que acoplava a validação das evidências dos sócios a esperar o aprovador entrar, às vezes dias depois; mudou de novo em 2026-07-31 — ver terceiro item):

- Se o `email` bate com o signatário fixo de papel `APROVAR` (Jean, estágio 1) **e** o contrato ainda não estiver `assinado`: `contrato.status` → `assinado_agencia` (só visibilidade — ver seção "Corrida" abaixo — não decide nada sobre `agencia.status`).
- Independente de quem assinou: o use-case busca todos os sócios do contrato (`ContratoSignatario`, estágio 0, snapshot congelado no momento da geração) e confere se cada um já tem assinatura registrada em `ContratoAssinatura` (por e-mail normalizado). Só quando **todos** os sócios já assinaram, `agencia.status` avança de `aguardando_assinatura` pra `aguardando_validacao` — não importa se o aprovador ou as testemunhas (estágio 2) já assinaram ou não.
- Se o `email` é do aprovador **e** a agência já está em `aguardando_validacao`: a assinatura dele em si é a aprovação formal do time de cadastro — `agencia.status` avança pra `aguardando_cadastramento` (2026-07-31 — único gatilho; decisão do usuário de remover o botão manual "Aprovar validação" que existia antes, o webhook é a fonte da verdade dessa transição).

```
uuid=doc-uuid-123, type_post=4, email=socio-ultimo@agencia.com  (último sócio a assinar)
→ { "processado": true }
   (agencia.status agora é aguardando_validacao, mesmo sem o aprovador ter assinado ainda)
```

```
uuid=doc-uuid-123, type_post=4, email=cadastro@sakuratur.com.br  (aprovador assina antes dos sócios terminarem)
→ { "processado": true, "motivo": "Assinatura registrada — ainda faltam sócios assinar." }
   (contrato.status já é assinado_agencia, mas agencia.status continua aguardando_assinatura)
```

```
uuid=doc-uuid-123, type_post=4, email=cadastro@sakuratur.com.br  (aprovador assina com a agência já em aguardando_validacao)
→ { "processado": true }
   (agencia.status agora é aguardando_cadastramento)
```

Quando o `type_post=1` (documento inteiro finalizado) chega depois disso, o use-case aceita `aguardando_assinatura`, `aguardando_validacao` ou `aguardando_cadastramento` como estado válido da agência — fecha `contrato.status = assinado` sempre, e "alcança" o próximo estágio (`aguardando_validacao` ou `aguardando_cadastramento`, conforme onde a agência estiver) só se ela ainda não tiver avançado sozinha via os "4" individuais — nunca regride.

**⚠️ Ainda não exercido contra a conta real** — só coberto por teste unitário. Sem `D4SIGN_WEBHOOK_URL` pública em dev, não há como confirmar o formato exato do `type_post=4` num evento real (a doc oficial não mostra um payload de exemplo completo, só a lista de campos).

### 8.2 E-mail não entregue (`type_post=2`) — indicativo na tela de Contrato

Confirmado na doc oficial: `type_post=2` traz `email` (quem não recebeu) e `message` (motivo/erro de entrega). O use-case registra isso em `ContratoEmailFalhaEntrega` (tabela nova, chave `contratoId`+`email`, upsert idempotente — não em `ContratoSignatario`, pra cobrir também os 4 signatários fixos da Sakura sem precisar de CPF deles). Não muda nenhum status de contrato/agência — é só visibilidade.

```
uuid=doc-uuid-123, type_post=2, email=socio@agencia.com, message=Caixa de entrada cheia
→ { "processado": true }
```

A tela `/cadastros/[id]` (seção "Contrato") mostra um badge **"E-mail não entregue"** ao lado do nome de quem está na lista, tanto na Fase 1 (sócios) quanto na Fase 2 (Sakura — que passou a listar os signatários fixos ativos de verdade, em vez do texto fixo "Sakura Consolidadora").

**⚠️ Ainda não exercido contra a conta real** — só coberto por teste unitário, mesma limitação do 8.1 (sem `D4SIGN_WEBHOOK_URL` pública em dev).

### 8.3 Documento cancelado (`type_post=3`) — pendente, documentado pra resolver depois

D4Sign também manda esse evento quando o documento é cancelado (manualmente no painel deles, ou por `sign_limit_date` vencido). Hoje o use-case só reconhece e ignora (mesmo bucket genérico dos typePost sem transição definida) — `agencia.status` fica preso em `aguardando_assinatura` pra sempre, sem qualquer sinalização pro analista. Falta decidir: pra onde a agência deveria ir (não existe hoje um status tipo "contrato cancelado, precisa gerar de novo" no enum `StatusAgencia`) e se precisa de algum alerta ativo (hoje não há canal de notificação — Slack/e-mail — nesse projeto). Não implementado ainda.

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

Se `D4SIGN_WEBHOOK_SECRET` estiver configurada, a rota valida o header `Content-Hmac: sha256=<hash>` (HMAC-SHA256 do `uuid` do documento com a secret). Sem essa variável: em produção (`NODE_ENV=production`) a rota **bloqueia com 500** — não faz sentido aceitar webhook sem autenticação num ambiente real; fora de produção, aceita sem validar (documentado, só pra não travar o webhook em dev antes da secret existir). Não testado ao vivo contra a conta real ainda.

### Corrida entre "assinatura individual" e "documento finalizado"

Os dois eventos (`type_post=4` de qualquer signatário e `type_post=1` do documento inteiro) podem chegar em qualquer ordem, ou quase simultâneos — `ProcessarWebhookD4SignUseCase` não usa transação nem lock entre a leitura e a escrita do status. Dois guards independentes cobrem isso: (1) pra não regredir `contrato.status` de `assinado` (final) de volta pra `assinado_agencia` (intermediário) quando o "4" do aprovador chega atrasado, o handler confere o status atual do contrato antes de escrever; (2) pra não reprocessar o avanço de `agencia.status` depois que ela já saiu de `aguardando_assinatura`, o handler confere o status atual da agência antes de rodar a checagem de sócios — tornando repetições (retry do D4Sign, ou o "1" chegando depois de um "4" que já fechou tudo) idempotentes. Não elimina 100% a corrida (duas leituras exatamente simultâneas antes de qualquer escrita ainda são possíveis), mas cobre o caso prático de entregas próximas, não instantâneas.
