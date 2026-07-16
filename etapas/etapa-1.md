[← Índice](./README.md)

# Etapa 1 — Análise

**Arquivo:** `src/pages/AdminEmpresa.tsx` (função `Etapa1`, linha ~152)

## Input

**Query real:** `AdminEmpresa.tsx:838` faz `select('*')` em `cadastros` — não é um select específico dos campos abaixo. Campos efetivamente **lidos** de `cad` dentro da função `Etapa1`:

- `id`, `cnpj`, `razao_social`, `nome_fantasia`, `email`, `telefone`
- `dados_receita` (JSON: situação, abertura, natureza jurídica, porte, CNAE principal/secundários, telefone, e-mail, endereço, simples, capital social)
- `validacoes` (JSON com `gate_etapa1` e `alertas`), `analise_ia_at`
- `etapa_atual`, `upload_token`, `socios`

> `status`, `data_solicitacao` e `avanco_forcado` **não são lidos** de `cad` dentro de `Etapa1` — aparecem só como chaves gravadas em `.update({...})` (ver Output), não como input consumido pela função.

> ⚠️ `dados_socios` **não** é lido dentro da função `Etapa1` — só é usado em outro trecho do arquivo (linha ~1076), fora desta etapa. A lista de sócios exibida é montada em duas etapas: `sociosBase` é `cad.socios` **ou** (se ausente) `dados_receita.qsa` — um fallback, não uma mescla (`AdminEmpresa.tsx:390`); em seguida `sociosBase` é mesclado com `extras` derivados de `representantes_legais` (prop `reps`) e de `cadastro_complementar.dados_representante` (prop `comp`), deduplicados por nome (linhas 393-410), formando a lista final `socios` (linha 411).

**Lido de outras tabelas:**

- `representantes_legais` — `nome`, `telefone` (onde `ativo = true`) — `nome` é usado dentro de `Etapa1` (linhas 245/253/259); `telefone` é buscado na query mas não chega a ser usado no corpo da função
- `cadastro_complementar` (`AdminEmpresa.tsx:869`) — o select busca `dados_representante`, `endereco_agencia_cep`, `endereco_agencia_numero`, `cadastur_file_path`, `comprovante_endereco_agencia_path`, `endereco_agencia_mesmo_titular`, `tipo_agencia`, `socio_vinculado_endereco`, mas só `dados_representante` é efetivamente usado dentro de `Etapa1` (linha 393, para montar a lista de sócios); os outros 6 campos são consumidos por `dispensaComprovanteEnderecoEmpresa()` em `src/components/empresa/Etapa2Parecer.tsx`, não por `Etapa1`

> ⚠️ `documentos` **não** é lido/usado dentro da função `Etapa1` — a prop `documentos` é recebida na assinatura da função mas nunca referenciada no corpo (152-796). A lista de documentos é buscada em nível de página (linhas 846-857) e renderizada por outro componente/aba, não pela função `Etapa1`.

**Edge Functions chamadas:**

- `reavaliar-gate-etapa1` — reavalia dados da Receita e status do gate
- `send-transactional-email` (template `cadastro-reprovado`) — e-mail de reprovação

**O que o gestor/admin vê (dentro de `Etapa1`):** razão social, nome fantasia, CNPJ, dados da Receita, QSA/sócios, compatibilidade de CNAE com turismo (códigos 7911-2, 7912-1, 7990-2), motivo de bloqueio do gate, contatos, endereço. **Não inclui** lista de documentos recebidos — essa informação não é consumida por `Etapa1` (ver nota acima).

## Output

**`cadastros` (update):**

- `etapa_atual`: `'ficha'` → `'complementar'` (aprovação) ou `'recusado'` (reprovação — `AdminEmpresa.tsx:306` grava `etapa_atual` e `status` como `'recusado'` na mesma chamada)
- `status`: `'recusado'` (na reprovação)
- `data_solicitacao`: timestamp ao avançar
- `nome_fantasia` (se editado manualmente)
- `avanco_forcado`: JSON `{ motivo, at, etapa: 'complementar', gate_motivo_bloqueio }` (override manual)

> ⚠️ `base_id`, `gestor_responsavel`, `executivo_id`, `promotor_responsavel` **não** são gravados pela função `Etapa1` — pertencem à seção "Equipe responsável" do mesmo arquivo (`AdminEmpresa.tsx:959-1040`), renderizada fora da aba desta etapa.

**`kanban_historico` (insert):**

- `cadastro_id`, `etapa_anterior`, `etapa_nova`, `usuario_email`
- `origem`: `'avanco_manual'` | `'avanco_manual_gate_etapa1'` | `'reprovacao_manual_etapa1'`
- `observacao`, `desbloqueio_manual`, `detalhes` (JSON)

> ⚠️ `usuario_email` só é gravado nos fluxos `'avanco_manual_gate_etapa1'` e `'reprovacao_manual_etapa1'` (`AdminEmpresa.tsx:265`, `317`). O avanço simples "Avançar e Enviar Link" (`origem: 'avanco_manual'`, `AdminEmpresa.tsx:214-220`) não inclui `usuario_email` no insert.

**`decisoes_humanas` (insert):**

- `cadastro_id`, `decisao_ia` (motivo do gate ou `'gate_nao_avaliado'`)
- `decisao_humana`: `'aprovado'` | `'reprovado'`
- `justificativa`, `usuario_email`, `etapa: 'analise'`

> O mínimo de 20 caracteres em `justificativa` é validação só de UI (desabilita o botão de confirmar, `AdminEmpresa.tsx:743`/`780`) — não há CHECK constraint no banco; a coluna é `TEXT NOT NULL` sem limite de tamanho.

**Efeitos colaterais:**

- Trigger de banco `trg_cadastro_entrada_complementar` (migration `20260623230437`) dispara quando `etapa_atual` entra em `'complementar'` **ou** `'documentos'` — não dispara e-mail direto, e sim a edge function `etapa-complementar-trigger`, que por sua vez chama `send-transactional-email` com o template `sakura-complete-cadastro` (não `cadastro-reprovado` — esse é usado só na reprovação, ver Output acima)
- Acesso público a `/cadastro-complementar/{upload_token}` é mediado por RPCs `SECURITY DEFINER` (não por uma policy de RLS aberta para `anon` — essa foi removida pela migration `20260624025802`)

**Gate de bloqueio automático:** função SQL `fn_gate_etapa1_to_complementar` (migration `20260619194642`) — CNPJ inativo (`situacao != 'ATIVA'`) ou nenhum CNAE de turismo — pode ser superado manualmente por quem tem papel `admin`/`cfo`/`ceo`/`diretor` (`AdminEmpresa.tsx:161-162`, resolução de papéis em `useUserRole.ts:70`) com justificativa.

## Resumo — Tabelas do Supabase

| Tabela             | Operação | Disparado por                   |
| ------------------ | -------- | ------------------------------- |
| `cadastros`        | UPDATE   | Aprovação/reprovação manual     |
| `kanban_historico` | INSERT   | Decisão de aprovação/reprovação |
| `decisoes_humanas` | INSERT   | Decisão de aprovação/reprovação |

## Edge Functions

| Função                       | Propósito                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reavaliar-gate-etapa1`      | Reavalia gate com dados da Receita                                                                                                                                                          |
| `send-transactional-email`   | Envio de e-mails transacionais (templates `cadastro-reprovado` na reprovação; `sakura-complete-cadastro` disparado indiretamente pelo trigger ao entrar em `'complementar'`/`'documentos'`) |
| `etapa-complementar-trigger` | Chamada pelo trigger de banco `trg_cadastro_entrada_complementar`; dispara o e-mail `sakura-complete-cadastro` com o link do formulário complementar                                        |
