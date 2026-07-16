# Schema do banco de dados

Documentação de `prisma/schema.prisma`: o que cada tabela representa, como
elas se relacionam, e por que o modelo é assim. Cobre o domínio de cadastro
de agências nas Etapas 1 (Análise), 2 (Complementar) e 3 (Contrato) — ver
[`etapas/README.md`](../etapas/README.md) para o mapeamento original de
inputs/outputs que serviu de base.

Todas as tabelas usam `id` texto (`cuid()`) como chave primária e, quando
aplicável, `createdAt`/`updatedAt`.

## Por que não tem JSON/JSONB

O sistema de referência (etapas 1-3) usa JSON em vários pontos: dados da
Receita Federal, alertas de gate, cônjuge, resultado de IA, campos
preenchidos do contrato, pendências de avanço forçado, detalhes de histórico.
JSON esconde a estrutura real do dado do banco — não dá pra indexar um
campo interno, validar tipo, ter FK, ou fazer `JOIN`/`GROUP BY` sem
ginástica de operadores `->>`. Cada JSON do original foi decomposto em
colunas ou tabelas próprias abaixo. O tradeoff: mais tabelas, mas cada
uma delas é consultável e íntegra por construção.

## Visão geral das relações

```
Cadastro (1) ──1:1── DadosReceita ──N:1── Cnae
   │                     │
   │                     └─1:1── Endereco (endereço da Receita)
   │
   ├─1:N── GateValidacao
   ├─1:N── Alerta
   ├─1:1── UsuarioMaster
   ├─1:1── CadastroComplementar ──1:N── VendaPercentual
   │            │
   │            ├─1:1── Endereco (endereço da agência)
   │            └─N:1── RepresentanteLegal (sócio vinculado ao endereço)
   │
   ├─1:N── RepresentanteLegal ──1:1── Endereco (endereço do sócio)
   │            │                └─1:1── Conjuge
   │            └─1:N── Documento
   │
   ├─1:N── Documento ──1:1── AnaliseIaDocumento
   │
   ├─1:N── Contrato ──1:N── ContratoSignatario ──1:N── ContratoCampoPendente
   │            (signatário = RepresentanteLegal OU SignatarioPadrao)
   │
   ├─1:N── AvancoForcado ──1:N── AvancoForcadoPendencia
   ├─1:N── KanbanHistorico
   ├─1:N── DecisaoHumana
   └─1:N── Notificacao

SignatarioPadrao (standalone, sem FK para Cadastro) ──1:N── ContratoSignatario
```

`Endereco` é um model reaproveitado por três donos distintos e mutuamente
exclusivos: o endereço da consulta à Receita (`DadosReceita`), o endereço da
agência (`CadastroComplementar`) e o endereço de cada sócio
(`RepresentanteLegal`). Em vez de repetir `cep`/`logradouro`/`numero`/... em
três tabelas, o FK único (`@unique`) fica do lado do **Endereco**, apontando
pro dono — não o contrário. Isso é proposital: um FK só cascateia do lado
referenciado para quem referencia, nunca ao contrário; se o dono guardasse
`enderecoId`, apagar o dono (ex.: via cascade a partir de `Cadastro`) nunca
apagaria o `Endereco` associado, deixando a linha órfã pra sempre (era assim
antes da migration `20260716021227_fix_endereco_orphan_fk_direction`). Com o
FK invertido, `onDelete: Cascade` em cada uma das três relações garante que
apagar o dono limpa o endereço junto. Exatamente um dos três
`*Id` deve estar preenchido por linha — não expresso como `CHECK` porque o
Prisma não suporta isso nativamente; é responsabilidade de quem cria o
`Endereco` (sempre via nested write dentro da criação do dono) preencher só
um.

## Tabelas

### `Cadastro` (`cadastros`)

Entidade central — uma linha por agência em processo de cadastro.

| Campo                                                               | Tipo                 | Notas                                                                                                                                  |
| ------------------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `cnpj`                                                              | `String` único       |                                                                                                                                        |
| `razaoSocial`, `nomeFantasia`, `email`, `telefone`                  | `String?`            | dados básicos                                                                                                                          |
| `origem`                                                            | `String?`            | rastreio de origem do pré-cadastro (Link 1) — slug de parceiro ou campanha/evento                                                      |
| `etapaAtual`                                                        | enum `EtapaCadastro` | máquina de estados: `FICHA → COMPLEMENTAR → DOCUMENTOS → CONTRATO → CREDENCIAIS`, ou `RECUSADO`                                        |
| `status`                                                            | `String?`            | livre (ex.: `'recusado'`); sem enum porque os docs não fecham o conjunto de valores                                                    |
| `uploadToken`                                                       | `String?` único      | token do link público de preenchimento (`/cadastro-complementar/{token}`)                                                              |
| `dataSolicitacao`, `analiseIaAt`                                    | `DateTime?`          | timestamps de fluxo                                                                                                                    |
| `sicaCodigo`, `travelLinkCriado*`                                   | —                    | saída da Etapa 3                                                                                                                       |
| `baseId`, `gestorResponsavel`, `executivoId`, `promotorResponsavel` | `String?`            | equipe responsável; ficam como identificadores soltos porque os docs de etapas 1-3 não detalham a tabela de staff que eles referenciam |

Por que não tem mais `dados_receita`/`validacoes`/`dados_login_master` como
JSON aqui: viraram `DadosReceita`, `GateValidacao`+`Alerta`, e
`UsuarioMaster` respectivamente (ver abaixo).

### `DadosReceita` (`dados_receita`) — 1:1 com `Cadastro`

Cache normalizado da consulta à Receita Federal por CNPJ. Antes era o JSON
`cadastros.dados_receita`.

`situacaoCadastral`, `dataAbertura`, `naturezaJuridica`, `porte`,
`capitalSocial` (`Decimal`, não `Float` — dinheiro nunca deve ser ponto
flutuante), `telefone`, `email`, `optanteSimples` + `dataOpcaoSimples`,
`endereco` (relação), `consultadoEm` (quando essa consulta foi feita —
substituída a cada reavaliação do gate).

### `Cnae` (`cnaes`) — N:1 com `DadosReceita`

CNAE principal e secundários viravam um array dentro do JSON da Receita;
agora é uma linha por código, com `principal: Boolean` marcando qual é o
principal. Permite `WHERE codigo IN (...)` para o check de compatibilidade
com turismo (`7911-2`, `7912-1`, `7990-2`) sem parsear JSON.

### `GateValidacao` (`gate_validacoes`) — N:1 com `Cadastro`

Antes era metade do JSON `cadastros.validacoes` (a parte `gate_etapa1`).
Uma linha por avaliação do gate automático (`liberado`, `motivoBloqueio`,
`etapaAlvo`, `avaliadoEm`) — como é histórico por natureza (reavaliado toda
hora que a IA roda de novo), guardar todas as avaliações em vez de
sobrescrever uma é estritamente melhor: dá pra auditar "por que foi
liberado" depois.

### `Alerta` (`alertas`) — N:1 com `Cadastro`

Era a outra metade do JSON `validacoes` (`alertas`). Uma linha por alerta
(`tipo`, `mensagem`, `criadoEm`, `resolvidoEm?`).

### `UsuarioMaster` (`usuarios_master`) — 1:1 com `Cadastro`

Era o JSON `cadastros.dados_login_master`. A Etapa 3 termina provisionando
esse acesso; os campos concretos (nome/email/ativo) não são detalhados nos
docs de etapas 1-3 porque quem realmente usa isso é a Etapa 4 (fora de
escopo) — mantido mínimo de propósito, pronto para crescer quando a Etapa 4
for modelada.

### `Endereco` (`enderecos`)

Compartilhado por três donos (ver diagrama acima). `cep`, `logradouro`,
`numero`, `complemento?`, `bairro`, `cidade`, `uf`.

### `CadastroComplementar` (`cadastro_complementar`) — 1:1 com `Cadastro`

Dados do formulário público de 7 passos preenchido pela agência.

- **Passo 2 (Empresa):** `siteEmpresa`, `telefoneComercial`, `emailOperacional`, `emailComercial`, `emailFinanceiro`
- **CADASTUR:** `cadasturNumero`, `cadasturDataCadastro`, `cadasturValidade`, `cadasturSituacao` — só os campos extraídos usados para checar validade; o arquivo em si e o payload bruto da IA vivem em `Documento`/`AnaliseIaDocumento`, não duplicados aqui
- **Passo 3 (Comercial):** `resideBrasil`. **`clienteInternacional` não existe como coluna** — no sistema original ele é gravado como o inverso de `resideBrasil` em dois pontos diferentes do código, o que é uma fonte de bug (podem dessincronizar). Aqui ele é sempre derivado na camada de aplicação (`!resideBrasil`), nunca armazenado.
- **Passo 6 (Endereço & Banco):** `tipoAgencia`, `enderecoAgencia` (relação), `enderecoAgenciaMesmoTitular`, `socioVinculadoEndereco` (FK para o `RepresentanteLegal` cujo endereço foi copiado — no original isso era um id solto sem constraint; aqui é uma FK de verdade), dados bancários (`bancoNo`, `agenciaNo`, `contaNo`, `tipoConta`, `favorecidoNome`, `favorecidoDoc`, `chavePix`, `tipoChavePix`, `tipoFaturamento`, `percCorporativo`/`percConvencional` como `Decimal(5,2)`)
- **Passo 7 (Revisão):** `submetidoAt` — presença desse timestamp é o que bloqueia reedição pelo link público

Passos 1, 4 e 5 do formulário original (documentos, representação, sócios)
não têm campos aqui — foram totalmente absorvidos por `Documento` e
`RepresentanteLegal` (ver abaixo). Isso elimina a necessidade dos triggers
de sincronização (`trg_sync_dados_representante`,
`trg_sync_representante_terceiro`) que existiam no sistema original só para
manter um JSON e uma tabela relacional em sincronia: aqui só existe a
tabela relacional.

### `VendaPercentual` (`venda_percentuais`) — N:1 com `CadastroComplementar`

Substitui os dois JSONs paralelos `vendas_tipo` (array) e
`vendas_percentuais` (mapa tipo→percentual) do Passo 3. Uma linha por
`tipo` (`TipoVenda`: `NACIONAL`/`INTERNACIONAL`/`TERRESTRE`) com seu
`percentual`. `@@unique([cadastroComplementarId, tipo])` impede duplicar o
mesmo tipo. A regra "soma 100%" é validação de aplicação, não constraint de
banco (não dá pra expressar `SUM() = 100` sobre linhas relacionadas em um
`CHECK` de coluna).

### `RepresentanteLegal` (`representantes_legais`) — N:1 com `Cadastro`

Sócios (PF ou PJ) **e** procurador/representante terceiro — unificados num
único model, diferenciados pelo campo `papel` (`SOCIO` | `PROCURADOR`). No
sistema original existiam dois caminhos de escrita para essa tabela: o
JSON `dados_representante` (sócios) e o JSON `representante_terceiro`
(procurador), cada um sincronizado por um trigger separado. Aqui não há
JSON nem trigger de sync — o procurador é só mais uma linha com
`papel = PROCURADOR`.

Campos: `nome`, `email`, `telefone`, `cpf`/`cnpj`, `isPj`, `rg`,
`rgOrgaoEmissor`, `dataNascimento`, `estadoCivil`, `regimeBens`,
`nacionalidade`, `cargo`, `ativo`, `origem` (de onde veio: QSA da Receita,
manual, ou procuração), `preenchidoPorIa` (substitui a chave
`preenchido_por_ia: true` do antigo JSON `dados_extras` — era a única
informação concreta que esse catch-all guardava). `endereco` e `conjuge`
são relações 1:1 próprias.

### `Conjuge` (`conjuges`) — 1:1 com `RepresentanteLegal`

Era o JSON `dados_conjuge`, preenchido só quando `estadoCivil = 'casado'`.
`nome`, `cpf?`, `rg?`, `nacionalidade?`. Ficar de fora (`null`) é o caso
normal para representantes solteiros — não força uma linha vazia.

### `Documento` (`documentos`) — N:1 com `Cadastro`, opcionalmente com `RepresentanteLegal`

Todo upload de arquivo do fluxo passa por aqui — inclusive o comprovante de
endereço da agência, que no sistema original tinha um caminho de upload
separado (`mode: 'raw_upload'`) que **não** gerava linha em `documentos`.
Ter um único destino de upload elimina essa exceção.

`tipo` (enum `TipoDocumento`: `CONTRATO_SOCIAL`, `CADASTUR`, `RG_CNPJ`,
`COMPROVANTE_ENDERECO`, `COMPROVANTE_ENDERECO_AGENCIA`,
`CERTIDAO_CASAMENTO`, `PROCURACAO`), `fileName`, `mimeType`, localização no
GCS (`gcsPath`, `gcsBucket`, `gcsSize?`, `gcsMd5?`), fluxo de aprovação
(`status`: `PENDENTE`/`APROVADO`/`REPROVADO`, `verificado`, `reprovadoPor`,
`motivoReprovacao`, `reprovadoEm`). `representanteLegalId` é uma FK de
verdade — no original o vínculo com o sócio era por **nome em texto**
(`nome_socio`), o que quebra se o sócio mudar de nome ou houver homônimos.

`decisoes_documentos` (JSON que existia em `cadastro_complementar` no
parecer do admin) não tem equivalente aqui — é puramente redundante com as
colunas de status já em `Documento`; duas fontes de verdade para a mesma
decisão é o tipo de coisa que normalização deveria eliminar, não replicar.

### `AnaliseIaDocumento` (`analises_ia_documentos`) — 1:1 com `Documento`

Era o JSON `resultado_ia`. Os docs só detalham o formato concreto para
CADASTUR (`numeroCadastur`, `razaoSocialExtraida`, `dataCadastroExtraida`,
`dataValidadeExtraida`, `situacaoExtraida`, `cnaeExtraido`), então é isso
que virou coluna; `scoreConfianca` (`Decimal(5,2)`) generaliza para
qualquer tipo de documento. Se outro tipo de documento passar a ter
extração estruturada própria, a rota é adicionar colunas aqui (ou uma
tabela filha), não voltar a um JSON genérico.

### `Contrato` (`contratos`) — N:1 com `Cadastro`

Um cadastro pode ter mais de um contrato ao longo do tempo (regeração); a
aplicação lê "o mais recente". `status` (enum `StatusContrato`, os 8
valores vigentes documentados: `RASCUNHO`, `ENVIADO`, `PROCESSANDO`,
`VISUALIZADO`, `ASSINADO_AGENCIA`, `ASSINADO`, `REJEITADO`, `CANCELADO`),
`numContrato` (gerado por trigger/sequência no banco, não pela aplicação),
`conteudoPreenchido` (texto do PDF renderizado — texto grande, não
estruturado, por isso `@db.Text` e não JSON), `d4signDocumentId`,
`contratoGcsPath` (PDF de rascunho/preview) vs. `pdfAssinadoGcsPath` (PDF
final assinado, setado só pelo webhook — **não é o mesmo campo**, apesar de
nomes parecidos no sistema original), `leituraConfirmada*`, `assinadoAt`.

`totalSignatarios` não é campo — é `contrato.signatarios.length` (ou
`_count` no Prisma). Guardar uma contagem redundante ao lado da relação que
já permite contá-la é exatamente o tipo de duplicação que causa
dessincronia.

### `ContratoSignatario` (`contrato_signatarios`) — N:1 com `Contrato`

Substitui o JSON `dados_preenchidos`: uma linha por signatário, com um
**snapshot imutável** dos dados no momento da geração do contrato (`nome`,
`email`, `cpf`, `rg`, `rgOrgaoEmissor`, `cargo`, `nacionalidade`,
`estadoCivil`, `dataNascimento`, e o endereço como colunas `*Snapshot`
soltas, não uma relação para `Endereco`). Isso é proposital: se o sócio
corrigir o endereço em `RepresentanteLegal` depois de o contrato já ter
sido gerado, o contrato já emitido não deve mudar retroativamente — um
snapshot em colunas próprias garante isso; uma FK para `Endereco`
compartilhado não garantiria.

`representanteLegalId` ou `signatarioPadraoId` (exatamente um dos dois)
identifica quem é o signatário — sócio/procurador da agência ou signatário
fixo da Sakura.

### `ContratoCampoPendente` (`contrato_campos_pendentes`) — N:1 com `ContratoSignatario`

Substitui o JSON `campos_pendentes`: uma linha por campo obrigatório
ausente naquele signatário quando o contrato foi gerado com
`force: true` ("Gerar mesmo assim").

### `AvancoForcado` (`avancos_forcados`) — N:1 com `Cadastro`

No sistema original, `avanco_forcado` era um único campo JSON em
`cadastros`, sobrescrito a cada override manual — perdendo o histórico de
overrides anteriores. Aqui é uma tabela: cada solicitação de avanço forçado
é uma linha (`etapaAlvo`, `motivo`, `gateMotivoBloqueio`, `statusReal`,
`solicitadoPor`, `autorizadoPor`, `createdAt`), preservando todas as vezes
que alguém pulou uma trava.

### `AvancoForcadoPendencia` (`avanco_forcado_pendencias`) — N:1 com `AvancoForcado`

Substitui o array `pendencias` dentro do JSON `avanco_forcado`: uma linha
por pendência que foi ignorada naquele override específico.

### `KanbanHistorico` (`kanban_historico`) — N:1 com `Cadastro`

Log de auditoria de toda transição de etapa: `etapaAnterior?`,
`etapaNova`, `usuarioEmail?` (nulo/`'sistema@d4sign'` nas transições
automáticas via trigger de banco), `origem` (ex.: `'avanco_manual'`,
`'avanco_forcado'`), `observacao`, `desbloqueioManual`. `detalhes` virou
`String? @db.Text` em vez de JSON: os docs nunca descrevem um formato
estruturado consultável para esse campo — é texto livre de contexto, então
uma coluna de texto é mais honesta que um JSON que ninguém consulta por
chave.

### `DecisaoHumana` (`decisoes_humanas`) — N:1 com `Cadastro`

Decisão de aprovação/reprovação manual em qualquer etapa que tenha gate
humano. `etapa` (enum `EtapaDecisao`: `ANALISE`/`COMPLEMENTAR`),
`decisaoIa?` (motivo do gate ou ausência de avaliação), `decisaoHumana`
(enum `ResultadoDecisao`: `APROVADO`/`REPROVADO`), `justificativa`
(`@db.Text`, sem limite de tamanho — o mínimo de 20 caracteres do sistema
original é regra de UI, não constraint de banco, e continua sendo aqui),
`usuarioEmail`, `modeloIa?`, `scoreIa?`, `divergiu?`.

### `Notificacao` (`notificacoes`) — N:1 com `Cadastro`

`tipo`, `titulo`, `mensagem`, `createdAt`. Simples porque os docs não
detalham mais campos além destes.

### `SignatarioPadrao` (`signatarios_padrao`)

Única tabela sem FK para `Cadastro` — são os signatários fixos da Sakura
(mesmos em todo contrato), não algo por agência. `ativo` + `ordem` definem
quais entram e em que sequência no contrato.

## Enums

| Enum                 | Valores                                                                                                                              | Onde é usado                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EtapaCadastro`      | `FICHA`, `COMPLEMENTAR`, `DOCUMENTOS`, `CONTRATO`, `CREDENCIAIS`, `RECUSADO`                                                         | `Cadastro.etapaAtual`, `GateValidacao.etapaAlvo`, `AvancoForcado.etapaAlvo`, `KanbanHistorico.etapaAnterior/etapaNova` — há etapas posteriores (`CREDENCIAIS → aprovado`) fora do escopo destes docs, não incluídas |
| `TipoDocumento`      | `CONTRATO_SOCIAL`, `CADASTUR`, `RG_CNPJ`, `COMPROVANTE_ENDERECO`, `COMPROVANTE_ENDERECO_AGENCIA`, `CERTIDAO_CASAMENTO`, `PROCURACAO` | `Documento.tipo`                                                                                                                                                                                                    |
| `StatusDocumento`    | `PENDENTE`, `APROVADO`, `REPROVADO`                                                                                                  | `Documento.status`                                                                                                                                                                                                  |
| `StatusContrato`     | `RASCUNHO`, `ENVIADO`, `PROCESSANDO`, `VISUALIZADO`, `ASSINADO_AGENCIA`, `ASSINADO`, `REJEITADO`, `CANCELADO`                        | `Contrato.status`                                                                                                                                                                                                   |
| `EtapaDecisao`       | `ANALISE`, `COMPLEMENTAR`                                                                                                            | `DecisaoHumana.etapa`                                                                                                                                                                                               |
| `ResultadoDecisao`   | `APROVADO`, `REPROVADO`                                                                                                              | `DecisaoHumana.decisaoHumana`                                                                                                                                                                                       |
| `PapelRepresentante` | `SOCIO`, `PROCURADOR`                                                                                                                | `RepresentanteLegal.papel`                                                                                                                                                                                          |
| `TipoVenda`          | `NACIONAL`, `INTERNACIONAL`, `TERRESTRE`                                                                                             | `VendaPercentual.tipo`                                                                                                                                                                                              |

Campos como `estadoCivil`, `tipoConta`, `tipoChavePix`, `tipoFaturamento`
ficaram como `String` livre em vez de enum: os docs de etapas 1-3 citam
esses campos mas não fecham o conjunto de valores válidos, e inventar um
enum sem essa confirmação arriscaria rejeitar valores reais do domínio.
Vale endurecer para enum assim que o conjunto de valores for confirmado.

## O que ficou de fora de propósito

- **Tabela de staff/usuários internos** (`gestorResponsavel`,
  `executivoId`, `promotorResponsavel`, roles admin/cfo/ceo/diretor) — os
  docs de etapas 1-3 mencionam esses campos mas não detalham a tabela que
  eles referenciam, então ficaram como identificadores soltos em vez de FK
  para um model inventado.
- **Etapas 4 e 5** (Usuário Master, Aprovado) — fora do escopo dos docs em
  `etapas/`. `UsuarioMaster` existe em forma mínima só porque a Etapa 3
  provisiona esse acesso; o resto do fluxo de credenciais não foi
  modelado.

## `Agencia` foi fundido em `Cadastro`

Existiu por um tempo um model `Agencia` separado (tabela `agencias`),
criado para o pré-cadastro público do Link 1 (`CAMPOS-LINK1-LINK2.md`),
sem nenhuma FK para `Cadastro`. Isso reproduzia, no schema, a mesma
agência em duas tabelas desconectadas — uma agência cadastrada pelo Link 1
não tinha caminho de dados para aparecer no funil do Admin, que lê
`Cadastro`. No Sakura original não existe essa duplicação: o submit do
Link 1 grava direto na mesma tabela `cadastros` que o Admin acompanha.

`Agencia` foi removida (migration `20260716014825_merge_agencia_into_cadastro`)
e o pré-cadastro do Link 1 agora cria diretamente um `Cadastro`:

- `contratoSocialPath` (era coluna solta em `Agencia`) → `Documento` com
  `tipo: CONTRATO_SOCIAL`, `cadastroId` apontando pro `Cadastro` recém-criado.
- `socios` (era `Json` em `Agencia` — a única coluna JSON que sobrava no
  domínio) → uma linha em `RepresentanteLegal` por sócio (`papel: SOCIO`),
  cada uma com seu próprio `Documento` (`tipo: RG_CNPJ`). `origem` em
  `RepresentanteLegal` grava `'qsa_receita'` ou `'manual'` — mesma
  semântica que já era usada pelo parecer do admin.
- `emailContato`/`telefoneContato` → `Cadastro.email`/`Cadastro.telefone`
  (já existiam; era exatamente o mesmo dado, "espelhado do primeiro
  sócio" na versão original).
- `origem` (rastreio de parceiro/evento) → nova coluna `Cadastro.origem`.
- `etapaAtual`/`status` (era `Int`/`String` com defaults próprios em
  `Agencia`) → usa os mesmos `EtapaCadastro.FICHA`/`status: null` que o
  restante do funil.

Resultado: uma agência criada pelo Link 1 já nasce como a mesma linha
`Cadastro` que o Admin lista e abre no dossiê — sem sincronização manual,
sem tabela paralela, sem JSON de sócios.
