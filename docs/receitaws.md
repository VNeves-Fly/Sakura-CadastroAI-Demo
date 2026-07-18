# ReceitaWS — consulta de CNPJ/QSA

**Arquivo:** `src/modules/cadastro/infrastructure/adapters/receitaws-qsa-consulta.adapter.ts`
**Ativado quando:** `RECEITAWS_API_TOKEN` está definida (senão cai pro `MockQsaConsultaService`).
**Spec oficial:** `https://developers.receitaws.com.br/receitaws.yaml`

## Base URLs

- **Pública (gratuita, sem token):** `https://receitaws.com.br/v1` — 3 consultas/min, só retorna CNPJ já em cache deles.
- **Comercial (paga, usada por nós):** mesma base, endpoint com `/days/{n}` e `Authorization: Bearer <token>`.

## Chamada usada em produção

```
GET https://receitaws.com.br/v1/cnpj/{cnpj}/days/{days}?fallback=cacheOnError
Authorization: Bearer <RECEITAWS_API_TOKEN>
```

`days` = `RECEITAWS_MAX_DAYS` (default `30`) — defasagem máxima do cache antes de forçar consulta em tempo real.

### Teste 1 — API pública, CNPJ real (`19131243000197`, sem token)

**Request:** `GET https://receitaws.com.br/v1/cnpj/19131243000197`

**Response — `200 OK`:**

```json
{
  "abertura": "03/10/2013",
  "situacao": "ATIVA",
  "tipo": "MATRIZ",
  "nome": "OPEN KNOWLEDGE BRASIL",
  "fantasia": "REDE PELO CONHECIMENTO LIVRE",
  "porte": "DEMAIS",
  "natureza_juridica": "399-9 - Associação Privada",
  "atividade_principal": [
    { "code": "94.30-8-00", "text": "Atividades de associações de defesa de direitos sociais" }
  ],
  "atividades_secundarias": [
    {
      "code": "94.93-6-00",
      "text": "Atividades de organizações associativas ligadas à cultura e à arte"
    },
    { "code": "94.99-5-00", "text": "Atividades associativas não especificadas anteriormente" },
    { "code": "85.99-6-99", "text": "Outras atividades de ensino não especificadas anteriormente" },
    {
      "code": "82.30-0-01",
      "text": "Serviços de organização de feiras, congressos, exposições e festas"
    },
    { "code": "62.04-0-00", "text": "Consultoria em tecnologia da informação" }
  ],
  "qsa": [{ "nome": "HAYDEE SVAB", "qual": "16-Presidente" }],
  "logradouro": "AVENIDA PAULISTA 37",
  "numero": "37",
  "complemento": "ANDAR 4",
  "municipio": "SAO PAULO",
  "bairro": "BELA VISTA",
  "uf": "SP",
  "cep": "01.311-902",
  "email": "torres.contab@gmail.com",
  "telefone": "(11) 2385-1939",
  "data_situacao": "03/10/2013",
  "cnpj": "19.131.243/0001-97",
  "status": "OK",
  "capital_social": "0.00",
  "simples": { "optante": false, "data_opcao": null, "data_exclusao": null },
  "simei": { "optante": false, "data_opcao": null, "data_exclusao": null },
  "billing": { "free": true, "database": true }
}
```

### Teste 2 — CNPJ inválido (`00000000000000`), API pública

**Request:** `GET https://receitaws.com.br/v1/cnpj/00000000000000`

**Response — `400 Bad Request`:**

```json
{ "status": "ERROR", "message": "CNPJ inválido" }
```

### Teste 3 — API comercial (paga, com token) via nosso adapter/rota `/api/cadastro/qsa`

**Request:** `POST /api/cadastro/qsa` → internamente `GET https://receitaws.com.br/v1/cnpj/19131243000197/days/30?fallback=cacheOnError` com `Authorization: Bearer <token>`.

**Response da nossa rota — `200 OK`** (já mapeado pro formato `QsaResult`):

```json
{
  "cnpj": "19131243000197",
  "razaoSocial": "OPEN KNOWLEDGE BRASIL",
  "cnaeCompativel": false,
  "socios": [{ "nome": "HAYDEE SVAB" }],
  "dataAbertura": "03/10/2013",
  "telefoneReceita": "(11) 2385-1939",
  "emailReceita": "torres.contab@gmail.com"
}
```

`cnaeCompativel: false` é esperado — `94.30-8-00` (associação) não é CNAE de agência de viagem (heurística: código começa com `79`).

### Teste 4 — CNPJ inválido, API comercial (achado real: doc oficial diverge do comportamento)

**Request:** `GET https://receitaws.com.br/v1/cnpj/00000000000000/days/30?fallback=cacheOnError` com `Authorization: Bearer <token>`

**Response — `400 Bad Request`** (a spec oficial deles documenta esse caso como `200` com `status: "ERROR"` — na prática vem `400`):

```json
{ "status": "ERROR", "message": "CNPJ inválido" }
```

**Bug que isso causou e foi corrigido:** o adapter só tratava `402`/`504` como "sem dado" e tudo mais como erro fatal → CNPJ inválido derrubava a rota com `500`. Corrigido pra ler o corpo JSON independente do status HTTP e decidir com base em `status: "ERROR"` do corpo, não do código HTTP.

### Teste 5 — mesmo CNPJ inválido, depois da correção, via nossa rota

**Request:** `POST /api/cadastro/qsa` com `{"cnpj":"00000000000000"}`

**Response — `404 Not Found`:**

```json
{ "error": "Consulta QSA não encontrado(a)." }
```

## Tratamento de erro no adapter

| Situação                          | HTTP do ReceitaWS      | Comportamento do adapter                 |
| --------------------------------- | ---------------------- | ---------------------------------------- |
| CNPJ válido, dado encontrado      | 200, `status: "OK"`    | Mapeia pra `QsaResult`                   |
| CNPJ inválido/rejeitado           | 400, `status: "ERROR"` | Retorna `null` (rota responde 404)       |
| Limite de consultas excedido      | 402                    | Retorna `null` (não bloqueia o cadastro) |
| Timeout na consulta em tempo real | 504                    | Retorna `null` (não bloqueia o cadastro) |
| Corpo não é JSON válido           | qualquer               | Lança erro (falha real, não esperada)    |
