# Google Cloud Storage — arquivos do cadastro

**Arquivo:** `src/modules/cadastro/infrastructure/adapters/gcs-file-storage.adapter.ts`
**Ativado quando:** `GCS_BUCKET_NAME` está definida no ambiente (senão cai pro `LocalFileStorage`, disco local em `./uploads`).
**Projeto GCP:** `c2f-sakura` · **Bucket:** `c2f-sakura-homolog` · **Prefixo:** `cadastro-ai`

Diferente do ReceitaWS/D4Sign/Flysakura, aqui não montamos requests HTTP na mão — usamos o SDK oficial (`@google-cloud/storage`). As chamadas abaixo são as operações do SDK que o código faz, com os parâmetros e resultados reais observados em teste.

## Credenciais

Service account `dev-bucket-prod@c2f-sakura.iam.gserviceaccount.com`, chave JSON referenciada via `GOOGLE_APPLICATION_CREDENTIALS`. Nunca é commitada (`.gitignore`: `*-sakura-*.json`).

## Operação: `save()` — upload de arquivo

```ts
await storage
  .bucket("c2f-sakura-homolog")
  .file(objectPath) // ex: "cadastro-ai/agencias/{cnpj}/contrato-social-{timestamp}.pdf"
  .save(buffer, { contentType: mimeType });
```

### Teste 1 — healthcheck manual

**Chamado com:** objeto `cadastro-ai/_healthcheck-1784311641088.txt`, conteúdo `"ok"` (2 bytes), `contentType: "text/plain"`.

**Resultado:** upload OK, sem erro. Objeto deletado logo em seguida (`bucket.file(objectPath).delete()`) — também sem erro.

### Teste 2 — submissão real via `FinalizarCadastroUseCase` (CNPJ de teste `11444777000161`)

Três arquivos sobem na mesma chamada de cadastro, um por `fileStorage.save()`:

| Object path                                                                | Tamanho  | Content-Type      |
| -------------------------------------------------------------------------- | -------- | ----------------- |
| `cadastro-ai/agencias/11444777000161/contrato-social-1784312021643.pdf`    | 13 bytes | `application/pdf` |
| `cadastro-ai/agencias/11444777000161/socio-0-rg-1784312022825.pdf`         | 30 bytes | `application/pdf` |
| `cadastro-ai/agencias/11444777000161/socio-0-procuracao-1784312023596.pdf` | 30 bytes | `application/pdf` |

Confirmado listando o bucket depois (`bucket.getFiles({ prefix })`) — os 3 objetos existiam com o tamanho exato dos bytes enviados no teste. Todos removidos depois (`file.delete()`) como limpeza de dado de teste.

## Operação: `getSignedUrl()` — usada pelo `FlysakuraAnaliseIaAdapter`

```ts
const [url] = await storage
  .bucket("c2f-sakura-homolog")
  .file(objectPath)
  .getSignedUrl({ action: "read", expires: Date.now() + 15 * 60 * 1000 }); // 15 min
```

Gera uma URL temporária de leitura pra cada documento (contrato social, RG, procuração) antes de mandar pro agente de IA analisar — sem isso, o agente externo não teria como acessar um arquivo que está num bucket privado.

**Observação confirmada em teste:** a assinatura funciona mesmo apontando pra um `objectPath` que não existe de verdade no bucket — `getSignedUrl` não checa existência do objeto, só assina a URL. Isso não é bug: no fluxo real o arquivo sempre existe antes (upload roda antes da análise de IA no `use-case`), então não é um caminho alcançável em produção — só uma observação de comportamento do SDK.

## Fallback

`cadastro-publico.controller.ts` escolhe `GcsFileStorage` quando `GCS_BUCKET_NAME` existe, senão usa `LocalFileStorage` (grava em `./uploads`, só serve pra dev local — não sobrevive a deploy serverless).
