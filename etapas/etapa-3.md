[← Índice](./README.md)

# Etapa 3 — Contrato

**Arquivo:** `src/components/empresa/Etapa3Contrato.tsx`
**Diálogos relacionados:** `ConfirmacaoLeituraContratoDialog`, `SelecionarRepresentantesDialog`, `RevisarContratoDialog`, `SicaCard`, `AgenciaEnderecoDialog`

## Input

**Lido de `cadastros`:** o registro (`cad`) chega como prop vindo de `AdminEmpresa.tsx`, que faz `select('*')` (`AdminEmpresa.tsx:837-838`) — não é uma query própria de `Etapa3Contrato.tsx`. Campos efetivamente usados dentro deste componente: `id`, `cnpj`, `razao_social`, `nome_fantasia`, `telefone`, `email`, `sica_codigo`, `travel_link_criado(_em/_por)`, `etapa_atual`, `avanco_forcado`, `dados_receita`

> ⚠️ `dados_login_master` **não** é lido em `Etapa3Contrato.tsx` — é usado só em `Etapa4UsuarioMaster.tsx`, `Etapa5Aprovado.tsx`, `AdminEmpresa.tsx` e `AdminCadastros.tsx`, fora deste componente.

**Lido de `representantes_legais`:** todos os ativos do cadastro — `nome`, `email`, `telefone`, `cpf`, `rg`, `rg_orgao_emissor`, `estado_civil`, `data_nascimento`, `nacionalidade`, `cargo`, `endereco`, `is_pj`, `dados_extras`

**Lido de `signatarios_padrao`:** signatários fixos da Sakura (`ativo = true`, ordenados por `ordem`)

**Lido de `cadastro_complementar`:** query própria em `Etapa3Contrato.tsx:290` (`select('*')`), da qual são usados diretamente `dados_representante` (linha 403) e `endereco_agencia_*` (linhas 374-380). `socio_vinculado_endereco` **não** é lido diretamente no corpo deste arquivo (só aparece em comentário na linha 60, por analogia com `Etapa2Parecer.tsx`) — é lido/gravado pelo diálogo `AgenciaEnderecoDialog.tsx` (linhas 35/63/85), que este componente renderiza (linhas 1938-1944).

**Lido de `contratos`:** contrato mais recente — `id`, `status`, `num_contrato`, `d4sign_document_id`, `assinado_at`, `leitura_confirmada(_por/_em)`, `contrato_gcs_path`

**Edge Functions chamadas:**

- `extrair-signatario-ia` — completa campos ausentes do signatário via IA
- `contrato-gerar` — gera o PDF no D4Sign (input: `cadastro_id`, `force`, `representantes_ids`; output: `d4sign_document_id`, `preview_url`)
- `d4sign-send` — envia contrato para assinatura (input: `contrato_id`)
- `d4sign-status` — consulta/gerencia assinatura no D4Sign; aceita `action: 'status' | 'download' | 'resend' | 'sendtosigner' | 'cancel' | 'signers'` (este componente usa pelo menos `'status'`, `'download'` e `'cancel'`, além de `'signers'`)

## Output

**`cadastros` (update):**

- `sica_codigo` (entrada manual via modal)
- `travel_link_criado`, `travel_link_criado_em`, `travel_link_criado_por` (checkbox confirmando criação do Travel Link)
- `etapa_atual`: `'contrato'` → `'credenciais'` (ao avançar manualmente, `avancarManualmente()`) — **não** `'master'`; esse valor não existe como `etapa_atual` em lugar nenhum do código, só aparece como texto de UI ("Usuário Master"). `etapa_atual` é coluna livre (sem CHECK constraint no banco).
- **Segundo caminho, automático, para a mesma transição**: o trigger de banco `fn_contrato_assinado_avanca_etapa` (definido em `20260610151902_961ce92c-...sql`, reconectado por `20260713170000_reconectar_triggers_avanco_automatico.sql`) dispara em `contratos` sempre que `status` vira `'assinado'` (com `assinado_at`/`d4sign_document_id` setados) e avança `cadastros.etapa_atual` de `'contrato'` para `'credenciais'` **independente de alguém clicar em "Avançar"** na UI.
- `avanco_forcado`: JSON `{ motivo, at, etapa, pendencias, autorizado_por, solicitado_por, status_real }` (se forçado via edge function `forcar-avanco-etapa`, `forcar-avanco-etapa/index.ts:164-172`) — `Etapa3Contrato.tsx:1785` lê especificamente `autorizado_por`

**`representantes_legais` (update por signatário):** `email`, `telefone`, `cpf`, `rg`, `rg_orgao_emissor`, `estado_civil`, `data_nascimento`, `nacionalidade`, `cargo`, `endereco`, `dados_extras` (marca `preenchido_por_ia: true` quando vem da IA)

**`contratos` (insert/update):**

- Geração — **insert** (`contrato-gerar/index.ts:182-191`): `cadastro_id`, `status: 'rascunho'`, `conteudo_preenchido`, `total_signatarios`, `dados_preenchidos`, `campos_pendentes`, `gerado_em`, `gerado_por`, `leitura_confirmada: false`. **`d4sign_document_id` NÃO é gravado nesse insert** — só depois, via **update** separado (`contrato-gerar/index.ts:361-399`, após o documento ser efetivamente criado no D4Sign), junto com `contrato_gcs_path` (ver nota abaixo). **`num_contrato` também não é gravado pela edge function** — é preenchido automaticamente por um trigger de banco `BEFORE INSERT`, `fn_contratos_set_num_contrato` (migration `20260624194910`), que gera `'CT-' || ano || '-' || sequência` como valor default.
- Envio (update, `d4sign-send/index.ts:334`): `status: 'enviado'` (progride depois para `'processando'`/`'visualizado'`/`'assinado_agencia'` via webhook/polling). **`leitura_confirmada(_por/_em)` NÃO é setado pelo `d4sign-send`** — é setado antes, pelo frontend, em `registrarConfirmacaoLeitura()` (`Etapa3Contrato.tsx:552-559`, chamado na linha 652 antes de `enviarD4Sign()`); `d4sign-send` inclusive **bloqueia com HTTP 412 `leitura_nao_confirmada`** se essa confirmação ainda não existir (`d4sign-send/index.ts:194-201`).
- Estado intermediário `'assinado_agencia'` (webhook, `d4sign-webhook/index.ts:326,408`): quando os signatários da agência já assinaram mas a assinatura interna da Sakura ainda está pendente. Usado também em `Etapa4UsuarioMaster.tsx:140`, `contrato-gerar/index.ts:168`, `d4sign-reconcile/index.ts:54`, `src/utils/contratoStatus.ts`.
- Conclusão da assinatura (update via webhook, `d4sign-webhook/index.ts:512`): `status: 'assinado'`, `assinado_at`. **`contrato_gcs_path` NÃO é gravado aqui** — o PDF final assinado vai para uma coluna diferente, `pdf_assinado_gcs_path` (`d4sign-webhook/index.ts:536`). `contrato_gcs_path` só é gravado uma vez, pelo `contrato-gerar/index.ts:369`, para o PDF de rascunho/preview (ver nota abaixo) — a doc anterior misturava os dois campos.
- Valores válidos de `status` (CHECK constraint `contratos_status_check`): a tabela foi criada em `20260407031842` só com `DEFAULT 'rascunho'`, sem CHECK; a migration `20260624033308` adicionou o CHECK com 7 valores; a migration `20260704120000_contrato_status_assinado_agencia.sql` **substituiu esse CHECK** para adicionar um 8º valor. Lista atual, vigente: `'rascunho' | 'enviado' | 'processando' | 'visualizado' | 'assinado_agencia' | 'assinado' | 'rejeitado' | 'cancelado'` — **não existem** os valores `'criado'` nem `'enviado_para_assinatura'`

> ⚠️ Não existe campo booleano `assinado` — o status de assinatura é rastreado só por `status: 'assinado'` + timestamp `assinado_at`.
>
> `contrato_gcs_path` e `preview_url` **não são o mesmo valor sob nomes diferentes**: `contrato-gerar/index.ts` monta um _path_ local (`contratos-preview/{contrato_id}.pdf`), faz o rehost do PDF do D4Sign para esse path no GCS, e é esse **path** que é gravado em `contrato_gcs_path`. O `preview_url` retornado pela edge function é uma **URL assinada** resolvida a partir desse mesmo rehost — os dois valores são derivados um do outro, mas não são a mesma string. Note que `contrato_gcs_path` é sempre o PDF de rascunho/preview, nunca o PDF final assinado (que vai para `pdf_assinado_gcs_path`, gravado só pelo webhook).

**`kanban_historico` (insert, ao avançar para Etapa 4):** `etapa_anterior: 'contrato'` → `etapa_nova: 'credenciais'` (não `'master'`), `origem: 'manual'` (`Etapa3Contrato.tsx:731`; não existem os sufixos `_etapa3` — o avanço forçado usa `origem: 'avanco_forcado'` via edge function `forcar-avanco-etapa`, separada deste fluxo), `observacao`, `desbloqueio_manual`, `detalhes`

> Existe um **terceiro caminho de insert**: o trigger automático `fn_contrato_assinado_avanca_etapa` (ver nota do Output em `cadastros` acima) também insere em `kanban_historico` (migration `20260610151902...sql:37-47`) ao avançar `etapa_atual` sozinho — mas **sem campo `origem`**, só com `usuario_email: 'sistema@d4sign'`.

**Bloqueios para gerar contrato:**

- Etapa 2 ainda não aprovada → HTTP 409 `etapa_nao_liberada` — gate incondicional, **`force: true` não contorna esse bloqueio** (só contorna o de campos ausentes abaixo)
- Campos obrigatórios ausentes por signatário → HTTP 422 `campos_pendentes`, contornável com `force: true` ("Gerar mesmo assim"). Dois conjuntos de regras diferentes coexistem no código:
  - **Lista exibida na UI** (badges de status em `Etapa3Contrato.tsx:199`, `REQUIRED_SIG_FIELDS`): PJ = `nome`/`email`/`telefone`/`cargo`; PF = `nome`/`email`/`telefone`/`cpf`/`rg`/`data_nascimento`/`cargo`/`nacionalidade`/`estado_civil`/`endereco_completo` — **não inclui `rg_orgao_emissor`**, apesar de o backend exigir esse campo
  - **Lista realmente aplicada no backend** (`contrato-gerar/_helpers.ts:27-45`, `REP_REQUIRED`/`REP_ADDR_REQUIRED`): nome/cpf/rg/rg_orgao_emissor/nacionalidade/estado_civil/cargo/email + logradouro/cidade/uf — e **representantes PJ são pulados inteiramente** (`_helpers.ts:130: if (r.is_pj) return`), ou seja, não há bloqueio de campos para PJ no backend, mesmo que a UI mostre badges para eles

**Requisitos para avançar à Etapa 4 (Usuário Master)** (checados em `avancarManualmente()`):

1. Contrato `status = 'assinado'` (`Etapa3Contrato.tsx:705`)
2. `travel_link_criado = true` (`Etapa3Contrato.tsx:673`, `714`)

> `leitura_confirmada` não é checado de forma independente nesse gate — na prática já é sempre `true` quando `status === 'assinado'`, porque é setado como efeito colateral de `enviarD4Sign()` (linha 652) _antes_ do contrato poder ir para assinatura, não porque `avancarManualmente()` o valide.
>
> Esses dois requisitos só valem para o avanço **manual**. O trigger automático `fn_contrato_assinado_avanca_etapa` (ver Output) pode produzir a mesma transição de `etapa_atual` para `'credenciais'` assim que `contratos.status` vira `'assinado'`, sem que `avancarManualmente()` chegue a rodar nem que `travel_link_criado` seja checado.

## Resumo — Tabelas do Supabase

| Tabela                  | Operação      | Disparado por                                                                                                                                                                                  |
| ----------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `representantes_legais` | UPDATE        | Edição manual ou extração via IA                                                                                                                                                               |
| `contratos`             | INSERT/UPDATE | Geração / envio / assinatura                                                                                                                                                                   |
| `cadastros`             | UPDATE        | Travel Link / SICA / avanço para Etapa 4 (`etapa_atual: 'credenciais'`) — manual **ou** automático via trigger `fn_contrato_assinado_avanca_etapa` quando `contratos.status` vira `'assinado'` |
| `kanban_historico`      | INSERT        | Avanço para Etapa 4 (`etapa_nova: 'credenciais'`) — manual (`origem: 'manual'`) ou automático via trigger (sem `origem`, `usuario_email: 'sistema@d4sign'`)                                    |

## Edge Functions

| Função                     | Propósito                               |
| -------------------------- | --------------------------------------- |
| `extrair-signatario-ia`    | Preenche campos ausentes do signatário  |
| `contrato-gerar`           | Gera contrato no D4Sign                 |
| `d4sign-send`              | Envia contrato para assinatura          |
| `d4sign-status`            | Consulta status de assinatura no D4Sign |
| `send-transactional-email` | Envio de e-mails transacionais          |
