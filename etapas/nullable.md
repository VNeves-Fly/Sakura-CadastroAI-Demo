[← Índice](./README.md)

# Campos nullable vs. obrigatórios (schema Prisma)

Levantamento de todos os modelos em `prisma/schema.prisma`: quais colunas aceitam `NULL` no Postgres e quais são `NOT NULL`. Dentro de "obrigatório" distingo dois casos, porque têm implicações diferentes pra quem grava a linha:

- **Obrigatório** — sem `@default`, precisa ser passado explicitamente na criação (senão o Prisma/Postgres rejeita).
- **Obrigatório (default)** — `NOT NULL`, mas tem `@default(...)`/`@updatedAt`, então o banco preenche sozinho se o campo for omitido.
- **Nullable** — tipo com `?` no schema, aceita `NULL`, nunca é exigido.

Colunas de FK opcionais (ex.: `representanteLegalId` em `Documento`) contam como nullable.

## User

| Campo     | Tipo            | Situação                       |
| --------- | --------------- | ------------------------------ |
| id        | String          | Obrigatório (default `cuid()`) |
| name      | String          | Obrigatório                    |
| email     | String (unique) | Obrigatório                    |
| password  | String          | Obrigatório                    |
| createdAt | DateTime        | Obrigatório (default `now()`)  |
| updatedAt | DateTime        | Obrigatório (default auto)     |

## Cadastro

| Campo               | Tipo             | Situação                       |
| ------------------- | ---------------- | ------------------------------ |
| id                  | String           | Obrigatório (default `cuid()`) |
| cnpj                | String? (unique) | Nullable                       |
| razaoSocial         | String?          | Nullable                       |
| nomeFantasia        | String?          | Nullable                       |
| email               | String?          | Nullable                       |
| telefone            | String?          | Nullable                       |
| origem              | String?          | Nullable                       |
| analiseIaAt         | DateTime?        | Nullable                       |
| etapaAtual          | EtapaCadastro    | Obrigatório (default `FICHA`)  |
| status              | String?          | Nullable                       |
| dataSolicitacao     | DateTime?        | Nullable                       |
| uploadToken         | String? (unique) | Nullable                       |
| sicaCodigo          | String?          | Nullable                       |
| travelLinkCriado    | Boolean          | Obrigatório (default `false`)  |
| travelLinkCriadoEm  | DateTime?        | Nullable                       |
| travelLinkCriadoPor | String?          | Nullable                       |
| baseId              | String?          | Nullable                       |
| gestorResponsavel   | String?          | Nullable                       |
| executivoId         | String?          | Nullable                       |
| associacaoId        | String?          | Nullable                       |
| promotorResponsavel | String?          | Nullable                       |
| createdAt           | DateTime         | Obrigatório (default `now()`)  |
| updatedAt           | DateTime         | Obrigatório (default auto)     |

## DadosReceita

| Campo             | Tipo                | Situação                       |
| ----------------- | ------------------- | ------------------------------ |
| id                | String              | Obrigatório (default `cuid()`) |
| cadastroId        | String (unique, FK) | Obrigatório                    |
| situacaoCadastral | String?             | Nullable                       |
| dataAbertura      | DateTime?           | Nullable                       |
| naturezaJuridica  | String?             | Nullable                       |
| porte             | String?             | Nullable                       |
| capitalSocial     | Decimal?            | Nullable                       |
| telefone          | String?             | Nullable                       |
| email             | String?             | Nullable                       |
| optanteSimples    | Boolean             | Obrigatório (default `false`)  |
| dataOpcaoSimples  | DateTime?           | Nullable                       |
| consultadoEm      | DateTime            | Obrigatório (default `now()`)  |

## Cnae

| Campo          | Tipo        | Situação                       |
| -------------- | ----------- | ------------------------------ |
| id             | String      | Obrigatório (default `cuid()`) |
| dadosReceitaId | String (FK) | Obrigatório                    |
| codigo         | String?     | Nullable                       |
| descricao      | String?     | Nullable                       |
| principal      | Boolean     | Obrigatório (default `false`)  |

## GateValidacao

| Campo          | Tipo           | Situação                       |
| -------------- | -------------- | ------------------------------ |
| id             | String         | Obrigatório (default `cuid()`) |
| cadastroId     | String (FK)    | Obrigatório                    |
| etapaAlvo      | EtapaCadastro? | Nullable                       |
| liberado       | Boolean?       | Nullable                       |
| motivoBloqueio | String?        | Nullable                       |
| avaliadoEm     | DateTime       | Obrigatório (default `now()`)  |

## Alerta

| Campo       | Tipo        | Situação                       |
| ----------- | ----------- | ------------------------------ |
| id          | String      | Obrigatório (default `cuid()`) |
| cadastroId  | String (FK) | Obrigatório                    |
| tipo        | String?     | Nullable                       |
| mensagem    | String?     | Nullable                       |
| criadoEm    | DateTime    | Obrigatório (default `now()`)  |
| resolvidoEm | DateTime?   | Nullable                       |

## UsuarioMaster

| Campo      | Tipo                | Situação                       |
| ---------- | ------------------- | ------------------------------ |
| id         | String              | Obrigatório (default `cuid()`) |
| cadastroId | String (unique, FK) | Obrigatório                    |
| nome       | String?             | Nullable                       |
| email      | String?             | Nullable                       |
| ativo      | Boolean             | Obrigatório (default `false`)  |
| criadoEm   | DateTime            | Obrigatório (default `now()`)  |

## Endereco

Compartilhado por três donos mutuamente exclusivos — todas as três FKs são nullable porque só uma delas é preenchida por linha (ver comentário no schema).

| Campo                  | Tipo                 | Situação                       |
| ---------------------- | -------------------- | ------------------------------ |
| id                     | String               | Obrigatório (default `cuid()`) |
| cep                    | String?              | Nullable                       |
| logradouro             | String?              | Nullable                       |
| numero                 | String?              | Nullable                       |
| complemento            | String?              | Nullable                       |
| bairro                 | String?              | Nullable                       |
| cidade                 | String?              | Nullable                       |
| uf                     | String?              | Nullable                       |
| dadosReceitaId         | String? (unique, FK) | Nullable                       |
| cadastroComplementarId | String? (unique, FK) | Nullable                       |
| representanteLegalId   | String? (unique, FK) | Nullable                       |

## CadastroComplementar

| Campo                       | Tipo                | Situação                       |
| --------------------------- | ------------------- | ------------------------------ |
| id                          | String              | Obrigatório (default `cuid()`) |
| cadastroId                  | String (unique, FK) | Obrigatório                    |
| siteEmpresa                 | String?             | Nullable                       |
| telefoneComercial           | String?             | Nullable                       |
| emailOperacional            | String?             | Nullable                       |
| emailComercial              | String?             | Nullable                       |
| emailFinanceiro             | String?             | Nullable                       |
| cadasturNumero              | String?             | Nullable                       |
| cadasturDataCadastro        | DateTime?           | Nullable                       |
| cadasturValidade            | DateTime?           | Nullable                       |
| cadasturSituacao            | String?             | Nullable                       |
| resideBrasil                | Boolean?            | Nullable                       |
| tipoAgencia                 | String?             | Nullable                       |
| enderecoAgenciaMesmoTitular | Boolean?            | Nullable                       |
| socioVinculadoEnderecoId    | String? (FK)        | Nullable                       |
| bancoNo                     | String?             | Nullable                       |
| agenciaNo                   | String?             | Nullable                       |
| contaNo                     | String?             | Nullable                       |
| tipoConta                   | String?             | Nullable                       |
| favorecidoNome              | String?             | Nullable                       |
| favorecidoDoc               | String?             | Nullable                       |
| chavePix                    | String?             | Nullable                       |
| tipoChavePix                | String?             | Nullable                       |
| tipoFaturamento             | String?             | Nullable                       |
| percCorporativo             | Decimal?            | Nullable                       |
| percConvencional            | Decimal?            | Nullable                       |
| submetidoAt                 | DateTime?           | Nullable                       |
| createdAt                   | DateTime            | Obrigatório (default `now()`)  |
| updatedAt                   | DateTime            | Obrigatório (default auto)     |

## VendaPercentual

| Campo                  | Tipo        | Situação                       |
| ---------------------- | ----------- | ------------------------------ |
| id                     | String      | Obrigatório (default `cuid()`) |
| cadastroComplementarId | String (FK) | Obrigatório                    |
| tipo                   | TipoVenda?  | Nullable                       |
| percentual             | Decimal?    | Nullable                       |

## RepresentanteLegal

| Campo           | Tipo               | Situação                                                     |
| --------------- | ------------------ | ------------------------------------------------------------ |
| id              | String             | Obrigatório (default `cuid()`)                               |
| cadastroId      | String (FK)        | Obrigatório                                                  |
| nome            | String?            | Nullable                                                     |
| email           | String?            | Nullable                                                     |
| telefone        | String?            | Nullable                                                     |
| cpf             | String?            | Nullable (único junto com `cadastroId` só quando preenchido) |
| cnpj            | String?            | Nullable                                                     |
| isPj            | Boolean            | Obrigatório (default `false`)                                |
| rg              | String?            | Nullable                                                     |
| rgOrgaoEmissor  | String?            | Nullable                                                     |
| dataNascimento  | DateTime?          | Nullable                                                     |
| estadoCivil     | String?            | Nullable                                                     |
| regimeBens      | String?            | Nullable                                                     |
| nacionalidade   | String?            | Nullable                                                     |
| cargo           | String?            | Nullable                                                     |
| papel           | PapelRepresentante | Obrigatório (default `SOCIO`)                                |
| ativo           | Boolean            | Obrigatório (default `true`)                                 |
| origem          | String?            | Nullable                                                     |
| preenchidoPorIa | Boolean            | Obrigatório (default `false`)                                |
| createdAt       | DateTime           | Obrigatório (default `now()`)                                |
| updatedAt       | DateTime           | Obrigatório (default auto)                                   |

## Conjuge

| Campo                | Tipo                | Situação                       |
| -------------------- | ------------------- | ------------------------------ |
| id                   | String              | Obrigatório (default `cuid()`) |
| representanteLegalId | String (unique, FK) | Obrigatório                    |
| nome                 | String?             | Nullable                       |
| cpf                  | String?             | Nullable                       |
| rg                   | String?             | Nullable                       |
| nacionalidade        | String?             | Nullable                       |

## Documento

| Campo                | Tipo            | Situação                         |
| -------------------- | --------------- | -------------------------------- |
| id                   | String          | Obrigatório (default `cuid()`)   |
| cadastroId           | String (FK)     | Obrigatório                      |
| representanteLegalId | String? (FK)    | Nullable                         |
| tipo                 | TipoDocumento?  | Nullable                         |
| fileName             | String?         | Nullable                         |
| mimeType             | String?         | Nullable                         |
| gcsPath              | String?         | Nullable                         |
| gcsBucket            | String?         | Nullable                         |
| gcsSize              | Int?            | Nullable                         |
| gcsMd5               | String?         | Nullable                         |
| status               | StatusDocumento | Obrigatório (default `PENDENTE`) |
| verificado           | Boolean         | Obrigatório (default `false`)    |
| reprovadoPor         | String?         | Nullable                         |
| motivoReprovacao     | String?         | Nullable                         |
| reprovadoEm          | DateTime?       | Nullable                         |
| createdAt            | DateTime        | Obrigatório (default `now()`)    |
| updatedAt            | DateTime        | Obrigatório (default auto)       |

## AnaliseIaDocumento

| Campo                | Tipo                | Situação                       |
| -------------------- | ------------------- | ------------------------------ |
| id                   | String              | Obrigatório (default `cuid()`) |
| documentoId          | String (unique, FK) | Obrigatório                    |
| numeroCadastur       | String?             | Nullable                       |
| razaoSocialExtraida  | String?             | Nullable                       |
| dataCadastroExtraida | DateTime?           | Nullable                       |
| dataValidadeExtraida | DateTime?           | Nullable                       |
| situacaoExtraida     | String?             | Nullable                       |
| cnaeExtraido         | String?             | Nullable                       |
| scoreConfianca       | Decimal?            | Nullable                       |
| processadoEm         | DateTime            | Obrigatório (default `now()`)  |

## Contrato

| Campo                | Tipo             | Situação                         |
| -------------------- | ---------------- | -------------------------------- |
| id                   | String           | Obrigatório (default `cuid()`)   |
| cadastroId           | String (FK)      | Obrigatório                      |
| status               | StatusContrato   | Obrigatório (default `RASCUNHO`) |
| numContrato          | String? (unique) | Nullable                         |
| conteudoPreenchido   | String? (Text)   | Nullable                         |
| geradoEm             | DateTime?        | Nullable                         |
| geradoPor            | String?          | Nullable                         |
| leituraConfirmada    | Boolean          | Obrigatório (default `false`)    |
| leituraConfirmadaPor | String?          | Nullable                         |
| leituraConfirmadaEm  | DateTime?        | Nullable                         |
| d4signDocumentId     | String?          | Nullable                         |
| contratoGcsPath      | String?          | Nullable                         |
| pdfAssinadoGcsPath   | String?          | Nullable                         |
| assinadoAt           | DateTime?        | Nullable                         |
| createdAt            | DateTime         | Obrigatório (default `now()`)    |
| updatedAt            | DateTime         | Obrigatório (default auto)       |

## ContratoSignatario

Snapshot imutável dos dados do signatário no momento da geração do contrato — por isso quase tudo é nullable (o dado vem copiado de outra tabela, pode não existir ainda).

| Campo                | Tipo         | Situação                       |
| -------------------- | ------------ | ------------------------------ |
| id                   | String       | Obrigatório (default `cuid()`) |
| contratoId           | String (FK)  | Obrigatório                    |
| representanteLegalId | String? (FK) | Nullable                       |
| signatarioPadraoId   | String? (FK) | Nullable                       |
| nome                 | String?      | Nullable                       |
| email                | String?      | Nullable                       |
| cpf                  | String?      | Nullable                       |
| rg                   | String?      | Nullable                       |
| rgOrgaoEmissor       | String?      | Nullable                       |
| cargo                | String?      | Nullable                       |
| nacionalidade        | String?      | Nullable                       |
| estadoCivil          | String?      | Nullable                       |
| dataNascimento       | DateTime?    | Nullable                       |
| cepSnapshot          | String?      | Nullable                       |
| logradouroSnapshot   | String?      | Nullable                       |
| numeroSnapshot       | String?      | Nullable                       |
| complementoSnapshot  | String?      | Nullable                       |
| bairroSnapshot       | String?      | Nullable                       |
| cidadeSnapshot       | String?      | Nullable                       |
| ufSnapshot           | String?      | Nullable                       |

## ContratoCampoPendente

| Campo                | Tipo        | Situação                       |
| -------------------- | ----------- | ------------------------------ |
| id                   | String      | Obrigatório (default `cuid()`) |
| contratoSignatarioId | String (FK) | Obrigatório                    |
| campo                | String?     | Nullable                       |

## AvancoForcado

| Campo              | Tipo           | Situação                       |
| ------------------ | -------------- | ------------------------------ |
| id                 | String         | Obrigatório (default `cuid()`) |
| cadastroId         | String (FK)    | Obrigatório                    |
| etapaAlvo          | EtapaCadastro? | Nullable                       |
| motivo             | String?        | Nullable                       |
| gateMotivoBloqueio | String?        | Nullable                       |
| statusReal         | String?        | Nullable                       |
| solicitadoPor      | String?        | Nullable                       |
| autorizadoPor      | String?        | Nullable                       |
| createdAt          | DateTime       | Obrigatório (default `now()`)  |

## AvancoForcadoPendencia

| Campo           | Tipo        | Situação                       |
| --------------- | ----------- | ------------------------------ |
| id              | String      | Obrigatório (default `cuid()`) |
| avancoForcadoId | String (FK) | Obrigatório                    |
| descricao       | String?     | Nullable                       |

## KanbanHistorico

| Campo             | Tipo           | Situação                                                               |
| ----------------- | -------------- | ---------------------------------------------------------------------- |
| id                | String         | Obrigatório (default `cuid()`)                                         |
| cadastroId        | String (FK)    | Obrigatório                                                            |
| etapaAnterior     | EtapaCadastro? | Nullable                                                               |
| etapaNova         | EtapaCadastro? | Nullable                                                               |
| usuarioEmail      | String?        | Nullable (null/`sistema@d4sign` em transições automáticas via trigger) |
| origem            | String?        | Nullable                                                               |
| observacao        | String?        | Nullable                                                               |
| desbloqueioManual | Boolean?       | Nullable                                                               |
| detalhes          | String? (Text) | Nullable                                                               |
| createdAt         | DateTime       | Obrigatório (default `now()`)                                          |

## DecisaoHumana

| Campo         | Tipo              | Situação                       |
| ------------- | ----------------- | ------------------------------ |
| id            | String            | Obrigatório (default `cuid()`) |
| cadastroId    | String (FK)       | Obrigatório                    |
| etapa         | EtapaDecisao?     | Nullable                       |
| decisaoIa     | String?           | Nullable                       |
| decisaoHumana | ResultadoDecisao? | Nullable                       |
| justificativa | String? (Text)    | Nullable                       |
| usuarioEmail  | String?           | Nullable                       |
| modeloIa      | String?           | Nullable                       |
| scoreIa       | Float?            | Nullable                       |
| divergiu      | Boolean?          | Nullable                       |
| createdAt     | DateTime          | Obrigatório (default `now()`)  |

## Notificacao

| Campo      | Tipo        | Situação                       |
| ---------- | ----------- | ------------------------------ |
| id         | String      | Obrigatório (default `cuid()`) |
| cadastroId | String (FK) | Obrigatório                    |
| tipo       | String?     | Nullable                       |
| titulo     | String?     | Nullable                       |
| mensagem   | String?     | Nullable                       |
| createdAt  | DateTime    | Obrigatório (default `now()`)  |

## SignatarioPadrao

| Campo    | Tipo    | Situação                       |
| -------- | ------- | ------------------------------ |
| id       | String  | Obrigatório (default `cuid()`) |
| nome     | String? | Nullable                       |
| cargo    | String? | Nullable                       |
| email    | String? | Nullable                       |
| telefone | String? | Nullable                       |
| ativo    | Boolean | Obrigatório (default `true`)   |
| ordem    | Int?    | Nullable                       |

## Padrão geral do schema

Fora `User`, quase todo campo de negócio é nullable — decisão deliberada do modelo (ver `prisma/schema.prisma:21-28` e `schema.md`): os dados chegam incrementalmente ao longo das Etapas 1-3, então poucas colunas podem ser `NOT NULL` sem default. Os únicos campos realmente obrigatórios sem default (fora `id`/timestamps) são as FKs que amarram uma linha filha ao seu dono (ex.: `cadastroId`, `dadosReceitaId`, `documentoId`, `contratoId`) e os campos de `User` (autenticação).

## Resumo — todos os campos obrigatórios, por tabela

Todo campo listado abaixo é `NOT NULL`. Separado em **sem default** (quem cria a linha precisa informar o valor) e **com default** (o banco/Prisma preenche sozinho se omitido).

| Tabela                    | Obrigatórios sem default | Obrigatórios com default                                      |
| ------------------------- | ------------------------ | ------------------------------------------------------------- |
| users                     | name, email, password    | id, createdAt, updatedAt                                      |
| cadastros                 | —                        | id, etapaAtual, travelLinkCriado, createdAt, updatedAt        |
| dados_receita             | cadastroId               | id, optanteSimples, consultadoEm                              |
| cnaes                     | dadosReceitaId           | id, principal                                                 |
| gate_validacoes           | cadastroId               | id, avaliadoEm                                                |
| alertas                   | cadastroId               | id, criadoEm                                                  |
| usuarios_master           | cadastroId               | id, ativo, criadoEm                                           |
| enderecos                 | —                        | id                                                            |
| cadastro_complementar     | cadastroId               | id, createdAt, updatedAt                                      |
| venda_percentuais         | cadastroComplementarId   | id                                                            |
| representantes_legais     | cadastroId               | id, isPj, papel, ativo, preenchidoPorIa, createdAt, updatedAt |
| conjuges                  | representanteLegalId     | id                                                            |
| documentos                | cadastroId               | id, status, verificado, createdAt, updatedAt                  |
| analises_ia_documentos    | documentoId              | id, processadoEm                                              |
| contratos                 | cadastroId               | id, status, leituraConfirmada, createdAt, updatedAt           |
| contrato_signatarios      | contratoId               | id                                                            |
| contrato_campos_pendentes | contratoSignatarioId     | id                                                            |
| avancos_forcados          | cadastroId               | id, createdAt                                                 |
| avanco_forcado_pendencias | avancoForcadoId          | id                                                            |
| kanban_historico          | cadastroId               | id, createdAt                                                 |
| decisoes_humanas          | cadastroId               | id, createdAt                                                 |
| notificacoes              | cadastroId               | id, createdAt                                                 |
| signatarios_padrao        | —                        | id, ativo                                                     |

Duas tabelas (`cadastros` e `enderecos`) não têm nenhum campo obrigatório "sem default" — toda linha pode ser criada só com o que o Prisma preenche automaticamente (mais, no caso de `enderecos`, uma das três FKs de dono, que são todas nullable individualmente mas na prática uma delas deve ser preenchida).
