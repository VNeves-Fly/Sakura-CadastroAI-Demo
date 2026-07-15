[← Índice](./README.md)

# Etapa 2 — Complementar

**Arquivo (formulário público):** `src/pages/CadastroComplementar.tsx` (wizard de 7 passos, acessado via `upload_token`)
**Arquivo (parecer do admin):** `src/components/empresa/Etapa2Parecer.tsx`

## Passo 1 — Documentos

**Input:** `contrato_social_file` (obrigatório), `cadastur_file` (opcional) + extração automática via IA (`numero_cadastur`, `razao_social`, `data_cadastro`, `data_validade`, `situacao`, `cnae`)

**Output:**

- `documentos` (upsert via RPC): `cadastro_id`, `tipo` (`contrato_social` | `cadastur`), `gcs_path`, `gcs_bucket`, `gcs_size`, `mime_type`, `file_name`, `resultado_ia`, `status`
- `cadastro_complementar` (upsert): `cadastur_file_path`, `cadastur_file_name`, `cadastur_data_cadastro`, `cadastur_validade`, `cadastur_analise_ia`

> ⚠️ O insert/upsert em `documentos` neste passo não é um `.insert()` direto do client — é delegado à edge function `upload-commit-gcs` via `src/lib/uploadDocumentoGcs.ts`, que chama a RPC `upsert_documento_by_gcs` (migration `20260630015428`, "Fase 1.2: GCS como storage único").
>
> A migration `20260623221423` recriou `documentos` só com as 7 colunas de path específicas por tipo de arquivo (`file_path`, `cadastur_file_path`, `iata_file_path`, `procuracao_file_path`, `comprovante_endereco_agencia_path`, `representante_terceiro_rg_path`, `representante_terceiro_comprovante_path`) — mas a migration posterior `20260630015428` **adicionou de volta** as colunas genéricas `gcs_path`, `gcs_bucket`, `gcs_size`, `gcs_md5`, `mime_type` em `documentos`, e elas são hoje o destino **primário** de escrita: `upsert_documento_by_gcs` grava em `gcs_path`/`gcs_bucket`/`gcs_size`/`mime_type` e explicitamente zera `file_path` (`SET file_path = NULL`). `documentos.file_path` só permanece preenchido em registros legados pré-migração (fallback de leitura via Supabase Storage em `resolve-signed-url.ts`); não é mais escrito por uploads novos. `src/utils/reciclarCadastro.ts`, `src/utils/hardDeleteCadastro.ts` e `src/utils/missingDocuments.ts` leem `gcs_path`/`gcs_bucket` ativamente (não são leituras mortas).
>
> As colunas de path específicas por tipo em `cadastro_complementar` (`cadastur_file_path`, `iata_file_path`, `procuracao_file_path` etc. — tabela diferente de `documentos`) continuam sendo escritas e lidas normalmente pelos passos abaixo; a mudança da Fase 1.2 afeta só a tabela `documentos`.

## Passo 2 — Empresa

**Input:** `site_empresa`, `telefone_comercial` (ambos opcionais, com checkbox "não possui"), `email_operacional`, `email_comercial`, `email_financeiro`; pré-preenchidos da Receita: `data_abertura`, `telefone_receita`, `email_receita`

**Output:**

- `cadastro_complementar` (upsert): `site_empresa`, `telefone_comercial`, `email_operacional`, `email_comercial`, `email_financeiro`
- `cadastros` (update direto do client, **sem RPC**): `dados_socios` atualizado com e-mail/telefone por sócio (`CadastroComplementar.tsx:1858-1878` — lê `dados_socios` atual e grava de volta com `.update()`)

## Passo 3 — Comercial

**Input:** `vendas_tipo` (multi-select: Nacional/Internacional/Terrestre), `vendas_percentuais` (deve somar 100%), `reside_brasil` (boolean)

**Output:**

- `cadastro_complementar` (upsert): `vendas_tipo` (JSON), `vendas_percentuais` (JSON), `reside_brasil`, `cliente_internacional` (inverso de `reside_brasil`)

## Passo 4 — Representação

**Input:**

- Opção A: usar sócio existente como representante legal
- Opção B (`usaRepresentanteTerceiro = true`): dados do procurador externo — `nome`, `cpf`, `email`, `telefone`, `nacionalidade`, `estado_civil`, `rg`, `rg_orgao`, `endereco`. `cargo` **não tem input no formulário público** — fica fixo em `'Representante Legal (Procurador)'` (`CadastroComplementar.tsx:292`); o comentário no código (`:285`) explica que o contrato sempre imprime "REPRESENTANTE LEGAL" fixo, então o campo só precisa ser não-vazio, não editável pelo usuário
- Uploads: `repTerceiroRgFile`, `repTerceiroComprovanteFile`, `procuracaoFile`

**Output:**

- `documentos` (upsert via RPC `upsert_documento_by_gcs`, mesmo mecanismo do Passo 1): `tipo` (`rg_cnpj` | `comprovante_endereco` | `procuracao`), `nome_socio`, `gcs_path`, `gcs_bucket`, `gcs_size`, `mime_type`, `file_name`, `resultado_ia`, `status` — **não** `file_path` (a RPC nem inclui essa coluna no INSERT)
- `cadastro_complementar` (upsert): `representante_terceiro` (JSON completo), `representante_terceiro_rg_path/name`, `representante_terceiro_comprovante_path/name`, `procuracao_file_path/name`

## Passo 5 — Sócios

**Input por sócio (PF ou PJ, vindo da QSA/Receita ou manual):**

- Comuns: `nome`, `cargo`, `email`, `telefone`, `nacionalidade`
- PF: `cpf`, `rg`, `rg_orgao_emissor`, `data_nascimento`, `estado_civil`, `endereco` (CEP/logradouro/número/complemento/bairro/cidade/UF), `rg_file`, `comprovante_file`; se casado: `regime_bens`, dados do cônjuge, `certidao_casamento_file`
- PJ: `cnpj` + `endereco` (o formulário também coleta endereço para PJ; só o RG não se aplica)

**Output:**

- `cadastro_complementar` (upsert): `dados_representante` (JSON, objeto ou array) — **este é o único destino gravado pelo formulário público neste passo**
- `documentos` (upsert via RPC `upsert_documento_by_gcs`, por sócio PF): `tipo` (`rg_cnpj` | `comprovante_endereco` | `certidao_casamento`), `nome_socio`, `gcs_path`, `gcs_bucket`, `gcs_size`, `mime_type`, `file_name`, `resultado_ia`, `status` — **não** `file_path`

> ⚠️ O formulário (Passo 5) em si **não** faz nenhum `.insert()`/`.update()` direto em `representantes_legais` — grava só em `cadastro_complementar.dados_representante`. **Mas a tabela é populada automaticamente logo em seguida por triggers de banco**, não "só depois, no parecer do admin": a migration `20260707140000_centralizar_representantes_legais.sql` criou o trigger `trg_sync_dados_representante` (`AFTER INSERT OR UPDATE OF dados_representante ON cadastro_complementar`), que chama `fn_upsert_representante_legal(..., p_pode_sobrescrever = true)` e grava em `representantes_legais` já na submissão do Passo 5 (idem para o Passo 4: `representante_terceiro` tem seu próprio trigger `trg_sync_representante_terceiro`, criado em `20260707177000_papel_representante_legal.sql` e com seu mapeamento de campos estendido em `20260713190000` — essa extensão de 20260713190000 é sobre o trigger do Passo 4/`representante_terceiro`, não sobre `trg_sync_dados_representante`). Os campos gravados pelo trigger: `cadastro_id`, `nome`, `email`, `telefone`, `cpf`/`cnpj`, `rg`, `rg_orgao_emissor` (não `rg_orgao` — esse é só o nome do campo no formulário), `data_nascimento`, `estado_civil`, `nacionalidade`, `cargo`, `is_pj`, `origem`, `ativo`, `endereco` (JSON), `dados_extras` (JSON); o trigger de `representante_terceiro` também grava `papel` (adicionado em `20260707177000`). O parecer do admin (`Etapa2Parecer.tsx`) só edita/complementa essas linhas depois — não é o primeiro escritor (ver seção "Parecer do Admin" abaixo).

## Passo 6 — Endereço & Banco

**Input:**

- Endereço da agência: `tipo_agencia`, `endereco_agencia` (CEP/logradouro/número/etc.), `endereco_agencia_mesmo_titular`, `socio_vinculado_endereco`, `comprovante_endereco_agencia_file`
- Bancário: nome do banco (estado local do formulário ainda chama a variável de `bancoNome`), `agencia_no`, `conta_no`, `tipo_conta`, `favorecido_nome`, `favorecido_doc`, `chave_pix`, `tipo_chave_pix`, `tipo_faturamento`, `perc_corporativo`, `perc_convencional` (soma 100%)

**Output:**

- `cadastro_complementar` (upsert): `tipo_agencia`, `endereco_agencia_*` (cep/logradouro/numero/complemento/bairro/cidade/uf), `endereco_agencia_mesmo_titular`, `socio_vinculado_endereco`, `comprovante_endereco_agencia_path/name`, `banco_no`, `agencia_no`, `conta_no`, `tipo_conta`, `chave_pix`, `tipo_chave_pix`, `favorecido_doc`, `favorecido_nome`, `tipo_faturamento`, `perc_corporativo`, `perc_convencional`, `cliente_internacional` (recalculado de novo aqui a partir de `reside_brasil` do Passo 3)

> ⚠️ O comprovante de endereço da agência **não** gera linha em `documentos`: o upload usa `mode: 'raw_upload'` (`rawUploadFile`, `CadastroComplementar.tsx:1239-1247` e `:3607`) — esse modo da edge function `upload-commit-gcs` só devolve `{ gcs_path }`, sem inserir/upsertar em `documentos`. O path retornado é gravado direto em `cadastro_complementar.comprovante_endereco_agencia_path`. Isso é diferente dos outros uploads da Etapa 2 (contrato social, CADASTUR, RG/comprovante de sócio, procuração), que usam `mode: 'documentos'` (`uploadFileToStorage`) e por isso criam linha em `documentos`.

> A coluna no banco é `banco_no` (renomeada de `banco_nome` pela migration `20260414150931`) — só o nome da variável de estado no React continua `bancoNome`.

## Passo 7 — Revisão (envio final)

**Input:** resumo somente leitura de todos os passos + botão de envio (RPC `upsert_cadastro_complementar_by_token`)

**Output:**

- `cadastro_complementar` (upsert): payload completo consolidado + `submetido_at` (bloqueia reedição pelo link público)
- `cadastros` (update, no primeiro envio): `etapa_atual` → `'documentos'`
- `notificacoes` (insert): `tipo: 'complementar'`, título/mensagem
- Edge Functions disparadas (fire-and-forget): `validar-dados-complementares`, `validar-procuracao` (se houver procurador)

## Parecer do Admin (Etapa2Parecer.tsx)

**Input:** documentos + `resultado_ia`/`status`, decisões manuais por documento, parecer consolidado da IA (`parecer-consolidado-ia`), solicitações extras (`solicitacoes_documentos`)

**Output:**

- `documentos` (update): `status` (`aprovado`/`reprovado`/`pendente`), `verificado`, `reprovado_por`, `motivo_reprovacao`, `reprovado_em`
- `cadastro_complementar` (upsert): `decisoes_documentos` (JSON por documento)
- `decisoes_humanas` (insert): `etapa: 'complementar'`, `decisao_humana`, `justificativa`, `usuario_email`, `modelo_ia`, `score_ia` — `score_ia` já existia desde a migration `20260407140624`; a migration `20260630032147` só adicionou as colunas `modelo_ia`/`etapa`/`divergiu`
- `cadastros` (update, aprovação final): `etapa_atual` → `'contrato'`, `status`, `avanco_forcado` (se forçado com pendências)
- `kanban_historico` (insert): `etapa_anterior` → `etapa_nova: 'contrato'` — `etapa_anterior` é dinâmico (`cad.etapa_atual` no momento da decisão, tipicamente `'documentos'` ou `'complementar'`), não um literal fixo
- `representantes_legais` (insert/update manual pelo admin): **não é a primeira gravação** — as linhas já existem desde a submissão do Passo 4/5, criadas pelos triggers `trg_sync_dados_representante`/`representante_terceiro` descritos na nota do Passo 5. Aqui o admin só edita/corrige/soft-deleta essas linhas (`Etapa2Parecer.tsx:~1006-1086`) — campos `cadastro_id`, `nome`, `email`, `telefone`, `cpf`/`cnpj`, `rg`, `rg_orgao_emissor`, `data_nascimento`, `estado_civil`, `nacionalidade`, `cargo`, `ativo`, `endereco` (JSON), `dados_extras` (JSON)
- E-mail/WhatsApp de solicitação de documentos adicionais (`send-transactional-email` / `send-whatsapp-meta`)
- Edge functions adicionais chamadas aqui: `analise-documento-ia`, `analise-documento-complementar` — revalidação de documentos via IA

## Resumo — Tabelas do Supabase

| Tabela                  | Operação                               | Disparado por                                                                                             |
| ----------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `cadastro_complementar` | UPSERT (RPC)                           | Envio de cada passo / envio final (form) e decisão manual sobre documento (parecer)                       |
| `documentos`            | UPSERT (RPC `upsert_documento_by_gcs`) | Upload de arquivo (form)                                                                                  |
| `notificacoes`          | INSERT                                 | Primeiro envio do formulário (form)                                                                       |
| `cadastros`             | UPDATE                                 | Primeiro envio (`etapa_atual: 'documentos'`, form) e aprovação final (`etapa_atual: 'contrato'`, parecer) |
| `documentos`            | UPDATE                                 | Decisão manual sobre documento (parecer)                                                                  |
| `decisoes_humanas`      | INSERT                                 | Aprovação/reprovação final (parecer)                                                                      |
| `representantes_legais` | INSERT/UPDATE (trigger)                | Submissão do Passo 4/5 do form — via `trg_sync_dados_representante` e trigger de `representante_terceiro` |
| `representantes_legais` | UPDATE (manual)                        | Correções/edição do admin no parecer — **não** é a primeira gravação                                      |
| `kanban_historico`      | INSERT                                 | Aprovação/reprovação final (parecer)                                                                      |

## Edge Functions

| Função                           | Propósito                                          |
| -------------------------------- | -------------------------------------------------- |
| `validar-dados-complementares`   | Validação IA pós-envio do formulário               |
| `validar-procuracao`             | Validação IA da procuração                         |
| `parecer-consolidado-ia`         | Parecer consolidado por IA para o admin            |
| `send-whatsapp-meta`             | Solicitação de documentos via WhatsApp             |
| `analise-documento-ia`           | Revalidação de documento via IA (parecer do admin) |
| `analise-documento-complementar` | Validação IA de documento (form público + parecer) |
| `send-transactional-email`       | Envio de e-mails transacionais                     |
