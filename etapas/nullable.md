[← Índice](./README.md)

# Campos nullable vs. obrigatórios (schema Prisma)

Levantamento de todos os modelos em `prisma/schema.prisma`: quais colunas aceitam `NULL` no Postgres e quais são `NOT NULL`. Dentro de "obrigatório" distingo dois casos, porque têm implicações diferentes pra quem grava a linha:

- **Obrigatório** — sem `@default`, precisa ser passado explicitamente na criação (senão o Prisma/Postgres rejeita).
- **Obrigatório (default)** — `NOT NULL`, mas tem `@default(...)`/`@updatedAt`, então o banco preenche sozinho se o campo for omitido.
- **Nullable** — tipo com `?` no schema, aceita `NULL`, nunca é exigido.

Colunas de FK opcionais (ex.: `representanteLegalId` em `Documento`) contam como nullable.

> Este schema é a fusão do modelo normalizado original (etapas 1-3, sem JSON) com o que está implementado e rodando hoje em cima de `Agencia`: o wizard público (Link 1) já coleta tudo antes do submit, então os campos que ele sempre preenche viraram `NOT NULL` sem default — diferente do sistema de referência original, onde quase tudo era nullable porque o dado chegava incrementalmente ao longo de várias etapas. Tabelas/colunas do roadmap que a UI atual ainda não popula continuam nullable (ver notas por tabela).

## User

| Campo     | Tipo            | Situação                       |
| --------- | --------------- | ------------------------------ |
| id        | String          | Obrigatório (default `cuid()`) |
| name      | String          | Obrigatório                    |
| email     | String (unique) | Obrigatório                    |
| password  | String          | Obrigatório                    |
| createdAt | DateTime        | Obrigatório (default `now()`)  |
| updatedAt | DateTime        | Obrigatório (default auto)     |

## Agencia

Antes chamava `Cadastro`. Ao contrário do modelo original (quase tudo nullable, preenchido aos poucos), o wizard público já coleta razão social, CNPJ, contrato social e contatos num único submit — por isso esses campos são obrigatórios sem default.

| Campo              | Tipo            | Situação                           |
| ------------------ | --------------- | ---------------------------------- |
| id                 | String          | Obrigatório (default `cuid()`)     |
| razaoSocial        | String          | Obrigatório                        |
| cnpj               | String (unique) | Obrigatório                        |
| etapaAtual         | Int             | Obrigatório (default `1`)          |
| status             | StatusAgencia   | Obrigatório (default `em_analise`) |
| contratoSocialPath | String          | Obrigatório                        |
| emailContato       | String          | Obrigatório                        |
| telefoneContato    | String          | Obrigatório                        |
| origem             | String?         | Nullable                           |
| createdAt          | DateTime        | Obrigatório (default `now()`)      |
| updatedAt          | DateTime        | Obrigatório (default auto)         |

## DadosReceita

Roadmap — cache normalizado da consulta à Receita Federal, não populado pelo fluxo atual.

| Campo             | Tipo                | Situação                       |
| ----------------- | ------------------- | ------------------------------ |
| id                | String              | Obrigatório (default `cuid()`) |
| agenciaId         | String (unique, FK) | Obrigatório                    |
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

Roadmap — filho de `DadosReceita`.

| Campo          | Tipo        | Situação                       |
| -------------- | ----------- | ------------------------------ |
| id             | String      | Obrigatório (default `cuid()`) |
| dadosReceitaId | String (FK) | Obrigatório                    |
| codigo         | String?     | Nullable                       |
| descricao      | String?     | Nullable                       |
| principal      | Boolean     | Obrigatório (default `false`)  |

## GateValidacao

Roadmap — resultado do gate automático de IA; não populado hoje (a decisão da IA no fluxo atual mora só em `origemGeracao`/`status` de `Contrato`). `etapaAlvo` virou `Int?` (era o enum `EtapaCadastro?`, removido do schema).

| Campo          | Tipo        | Situação                       |
| -------------- | ----------- | ------------------------------ |
| id             | String      | Obrigatório (default `cuid()`) |
| agenciaId      | String (FK) | Obrigatório                    |
| etapaAlvo      | Int?        | Nullable                       |
| liberado       | Boolean?    | Nullable                       |
| motivoBloqueio | String?     | Nullable                       |
| avaliadoEm     | DateTime    | Obrigatório (default `now()`)  |

## Alerta

Roadmap.

| Campo       | Tipo        | Situação                       |
| ----------- | ----------- | ------------------------------ |
| id          | String      | Obrigatório (default `cuid()`) |
| agenciaId   | String (FK) | Obrigatório                    |
| tipo        | String?     | Nullable                       |
| mensagem    | String?     | Nullable                       |
| criadoEm    | DateTime    | Obrigatório (default `now()`)  |
| resolvidoEm | DateTime?   | Nullable                       |

## UsuarioMaster

Roadmap — Etapa 4, fora do fluxo implementado.

| Campo     | Tipo                | Situação                       |
| --------- | ------------------- | ------------------------------ |
| id        | String              | Obrigatório (default `cuid()`) |
| agenciaId | String (unique, FK) | Obrigatório                    |
| nome      | String?             | Nullable                       |
| email     | String?             | Nullable                       |
| ativo     | Boolean             | Obrigatório (default `false`)  |
| criadoEm  | DateTime            | Obrigatório (default `now()`)  |

## Endereco

Compartilhado por três donos mutuamente exclusivos — todas as três FKs são nullable porque só uma delas é preenchida por linha (ver comentário no schema). Não mudou no merge.

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

Guardava `siteEmpresa`/`bancoNo`/`agenciaNo`/`contaNo` no modelo antigo — renomeados/removidos pra bater com o que o Passo 2/6 do wizard atual manda (`bancoNome`/`bancoAgencia`/`bancoConta`), e ganhou `bancoPais`, `bancoSwift` e `favorecidoEhEmpresa`, que o modelo antigo não tinha.

| Campo                       | Tipo                | Situação                       |
| --------------------------- | ------------------- | ------------------------------ |
| id                          | String              | Obrigatório (default `cuid()`) |
| agenciaId                   | String (unique, FK) | Obrigatório                    |
| telefoneComercial           | String?             | Nullable                       |
| emailOperacional            | String?             | Nullable                       |
| emailComercial              | String?             | Nullable                       |
| emailFinanceiro             | String?             | Nullable                       |
| cadasturNumero              | String?             | Nullable (roadmap)             |
| cadasturDataCadastro        | DateTime?           | Nullable (roadmap)             |
| cadasturValidade            | DateTime?           | Nullable (roadmap)             |
| cadasturSituacao            | String?             | Nullable (roadmap)             |
| resideBrasil                | Boolean?            | Nullable (roadmap)             |
| tipoAgencia                 | String?             | Nullable (roadmap)             |
| enderecoAgenciaMesmoTitular | Boolean?            | Nullable                       |
| socioVinculadoEnderecoId    | String? (FK)        | Nullable                       |
| bancoPais                   | String?             | Nullable                       |
| bancoNome                   | String?             | Nullable                       |
| bancoAgencia                | String?             | Nullable                       |
| bancoConta                  | String?             | Nullable                       |
| bancoSwift                  | String?             | Nullable                       |
| tipoConta                   | String?             | Nullable                       |
| favorecidoEhEmpresa         | Boolean?            | Nullable                       |
| favorecidoNome              | String?             | Nullable                       |
| favorecidoDoc               | String?             | Nullable                       |
| chavePix                    | String?             | Nullable (roadmap)             |
| tipoChavePix                | String?             | Nullable (roadmap)             |
| tipoFaturamento             | String?             | Nullable (roadmap)             |
| percCorporativo             | Decimal?            | Nullable (roadmap)             |
| percConvencional            | Decimal?            | Nullable (roadmap)             |
| submetidoAt                 | DateTime?           | Nullable                       |
| createdAt                   | DateTime            | Obrigatório (default `now()`)  |
| updatedAt                   | DateTime            | Obrigatório (default auto)     |

## VendaPercentual

Roadmap — não mudou no merge.

| Campo                  | Tipo        | Situação                       |
| ---------------------- | ----------- | ------------------------------ |
| id                     | String      | Obrigatório (default `cuid()`) |
| cadastroComplementarId | String (FK) | Obrigatório                    |
| tipo                   | TipoVenda?  | Nullable                       |
| percentual             | Decimal?    | Nullable                       |

## RepresentanteLegal

Antes quase tudo era nullable (o sócio podia ser preenchido aos poucos). O wizard atual sempre coleta nome/e-mail/telefone/CPF/estado civil no mesmo submit, então esses campos viraram obrigatórios. Ganhou `isRepresentanteLegal` (novo — sócio marcado como representante legal da empresa, libera o slot de Procuração), distinto de `papel` (que segue existindo pra um procurador terceiro, roadmap).

| Campo                | Tipo               | Situação                                  |
| -------------------- | ------------------ | ----------------------------------------- |
| id                   | String             | Obrigatório (default `cuid()`)            |
| agenciaId            | String (FK)        | Obrigatório                               |
| nome                 | String             | Obrigatório                               |
| email                | String             | Obrigatório                               |
| telefone             | String             | Obrigatório                               |
| cpf                  | String             | Obrigatório (único junto com `agenciaId`) |
| cnpj                 | String?            | Nullable                                  |
| isPj                 | Boolean            | Obrigatório (default `false`)             |
| rg                   | String?            | Nullable                                  |
| rgOrgaoEmissor       | String?            | Nullable                                  |
| dataNascimento       | DateTime?          | Nullable                                  |
| estadoCivil          | String             | Obrigatório                               |
| regimeBens           | String?            | Nullable (roadmap)                        |
| nacionalidade        | String?            | Nullable                                  |
| cargo                | String?            | Nullable                                  |
| papel                | PapelRepresentante | Obrigatório (default `SOCIO`)             |
| isRepresentanteLegal | Boolean            | Obrigatório (default `false`)             |
| ativo                | Boolean            | Obrigatório (default `true`)              |
| origem               | String?            | Nullable                                  |
| preenchidoPorIa      | Boolean            | Obrigatório (default `false`)             |
| createdAt            | DateTime           | Obrigatório (default `now()`)             |
| updatedAt            | DateTime           | Obrigatório (default auto)                |

## Conjuge

Roadmap (Passo 5, PF casado) — não mudou no merge.

| Campo                | Tipo                | Situação                       |
| -------------------- | ------------------- | ------------------------------ |
| id                   | String              | Obrigatório (default `cuid()`) |
| representanteLegalId | String (unique, FK) | Obrigatório                    |
| nome                 | String?             | Nullable                       |
| cpf                  | String?             | Nullable                       |
| rg                   | String?             | Nullable                       |
| nacionalidade        | String?             | Nullable                       |

## Documento

`tipo` e `gcsPath` viraram obrigatórios (antes `TipoDocumento?`/`String?`): todo documento gravado pela aplicação (RG, procuração, contrato social) sempre sabe seu tipo e sempre tem um caminho retornado pelo `FileStorage`. `gcsBucket`/`gcsSize`/`gcsMd5` continuam nullable porque o `LocalFileStorage` atual não produz esses metadados (só o provedor GCS futuro produziria).

| Campo                | Tipo            | Situação                         |
| -------------------- | --------------- | -------------------------------- |
| id                   | String          | Obrigatório (default `cuid()`)   |
| agenciaId            | String (FK)     | Obrigatório                      |
| representanteLegalId | String? (FK)    | Nullable                         |
| tipo                 | TipoDocumento   | Obrigatório                      |
| fileName             | String?         | Nullable                         |
| mimeType             | String?         | Nullable                         |
| gcsPath              | String          | Obrigatório                      |
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

Roadmap — não mudou no merge.

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

`d4signDocumentId` (nullable) virou `provedorId` (obrigatório, genérico — não amarrado a um provedor específico). `origemGeracao` é novo e obrigatório (sem default: quem cria o contrato sempre sabe se foi a IA ou um analista que gerou). `geradoEm`/`geradoPor` foram removidos (redundantes com `createdAt`/quem chamou o use-case). `status` trocou o enum de 8 valores (`RASCUNHO`...`CANCELADO`) por um enum menor com só os valores que o fluxo atual usa.

| Campo                | Tipo                  | Situação                                      |
| -------------------- | --------------------- | --------------------------------------------- |
| id                   | String                | Obrigatório (default `cuid()`)                |
| agenciaId            | String (FK)           | Obrigatório                                   |
| provedorId           | String                | Obrigatório                                   |
| status               | StatusContrato        | Obrigatório (default `aguardando_assinatura`) |
| origemGeracao        | OrigemGeracaoContrato | Obrigatório                                   |
| numContrato          | String? (unique)      | Nullable (roadmap)                            |
| conteudoPreenchido   | String? (Text)        | Nullable (roadmap)                            |
| leituraConfirmada    | Boolean               | Obrigatório (default `false`)                 |
| leituraConfirmadaPor | String?               | Nullable (roadmap)                            |
| leituraConfirmadaEm  | DateTime?             | Nullable (roadmap)                            |
| contratoGcsPath      | String?               | Nullable (roadmap)                            |
| pdfAssinadoGcsPath   | String?               | Nullable (roadmap)                            |
| assinadoAt           | DateTime?             | Nullable (roadmap)                            |
| createdAt            | DateTime              | Obrigatório (default `now()`)                 |
| updatedAt            | DateTime              | Obrigatório (default auto)                    |

## ContratoSignatario

`nome`/`email`/`cpf` viraram obrigatórios: são sempre copiados do sócio (ou signatário padrão) no momento da geração, nunca ficam vazios. O resto do snapshot continua nullable (nem todo signatário tem todos os campos preenchidos na origem).

| Campo                | Tipo         | Situação                       |
| -------------------- | ------------ | ------------------------------ |
| id                   | String       | Obrigatório (default `cuid()`) |
| contratoId           | String (FK)  | Obrigatório                    |
| representanteLegalId | String? (FK) | Nullable                       |
| signatarioPadraoId   | String? (FK) | Nullable                       |
| nome                 | String       | Obrigatório                    |
| email                | String       | Obrigatório                    |
| cpf                  | String       | Obrigatório                    |
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

Roadmap — não mudou no merge.

| Campo                | Tipo        | Situação                       |
| -------------------- | ----------- | ------------------------------ |
| id                   | String      | Obrigatório (default `cuid()`) |
| contratoSignatarioId | String (FK) | Obrigatório                    |
| campo                | String?     | Nullable                       |

## AvancoForcado

Roadmap. `etapaAlvo` virou `Int?` (era `EtapaCadastro?`).

| Campo              | Tipo        | Situação                       |
| ------------------ | ----------- | ------------------------------ |
| id                 | String      | Obrigatório (default `cuid()`) |
| agenciaId          | String (FK) | Obrigatório                    |
| etapaAlvo          | Int?        | Nullable                       |
| motivo             | String?     | Nullable                       |
| gateMotivoBloqueio | String?     | Nullable                       |
| statusReal         | String?     | Nullable                       |
| solicitadoPor      | String?     | Nullable                       |
| autorizadoPor      | String?     | Nullable                       |
| createdAt          | DateTime    | Obrigatório (default `now()`)  |

## AvancoForcadoPendencia

Roadmap — não mudou no merge.

| Campo           | Tipo        | Situação                       |
| --------------- | ----------- | ------------------------------ |
| id              | String      | Obrigatório (default `cuid()`) |
| avancoForcadoId | String (FK) | Obrigatório                    |
| descricao       | String?     | Nullable                       |

## KanbanHistorico

Roadmap. `etapaAnterior`/`etapaNova` viraram `Int?` (eram `EtapaCadastro?`).

| Campo             | Tipo           | Situação                                                               |
| ----------------- | -------------- | ---------------------------------------------------------------------- |
| id                | String         | Obrigatório (default `cuid()`)                                         |
| agenciaId         | String (FK)    | Obrigatório                                                            |
| etapaAnterior     | Int?           | Nullable                                                               |
| etapaNova         | Int?           | Nullable                                                               |
| usuarioEmail      | String?        | Nullable (null/`sistema@d4sign` em transições automáticas via trigger) |
| origem            | String?        | Nullable                                                               |
| observacao        | String?        | Nullable                                                               |
| desbloqueioManual | Boolean?       | Nullable                                                               |
| detalhes          | String? (Text) | Nullable                                                               |
| createdAt         | DateTime       | Obrigatório (default `now()`)                                          |

## DecisaoHumana

Roadmap — não mudou no merge (fora renomear a FK).

| Campo         | Tipo              | Situação                       |
| ------------- | ----------------- | ------------------------------ |
| id            | String            | Obrigatório (default `cuid()`) |
| agenciaId     | String (FK)       | Obrigatório                    |
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

Roadmap — não mudou no merge (fora renomear a FK).

| Campo     | Tipo        | Situação                       |
| --------- | ----------- | ------------------------------ |
| id        | String      | Obrigatório (default `cuid()`) |
| agenciaId | String (FK) | Obrigatório                    |
| tipo      | String?     | Nullable                       |
| titulo    | String?     | Nullable                       |
| mensagem  | String?     | Nullable                       |
| createdAt | DateTime    | Obrigatório (default `now()`)  |

## SignatarioPadrao

Roadmap — não mudou no merge.

| Campo    | Tipo    | Situação                       |
| -------- | ------- | ------------------------------ |
| id       | String  | Obrigatório (default `cuid()`) |
| nome     | String? | Nullable                       |
| cargo    | String? | Nullable                       |
| email    | String? | Nullable                       |
| telefone | String? | Nullable                       |
| ativo    | Boolean | Obrigatório (default `true`)   |
| ordem    | Int?    | Nullable                       |

## Enums

| Enum                    | Valores                                                                                                                              | Onde é usado                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| `StatusAgencia`         | `em_analise`, `em_complementar`, `aguardando_assinatura`, `aguardando_validacao`, `aguardando_ativacao`, `ativo`, `recusado`         | `Agencia.status`              |
| `StatusContrato`        | `aguardando_assinatura`, `assinado`                                                                                                  | `Contrato.status`             |
| `OrigemGeracaoContrato` | `ia`, `humano`                                                                                                                       | `Contrato.origemGeracao`      |
| `TipoDocumento`         | `CONTRATO_SOCIAL`, `CADASTUR`, `RG_CNPJ`, `COMPROVANTE_ENDERECO`, `COMPROVANTE_ENDERECO_AGENCIA`, `CERTIDAO_CASAMENTO`, `PROCURACAO` | `Documento.tipo`              |
| `StatusDocumento`       | `PENDENTE`, `APROVADO`, `REPROVADO`                                                                                                  | `Documento.status`            |
| `PapelRepresentante`    | `SOCIO`, `PROCURADOR`                                                                                                                | `RepresentanteLegal.papel`    |
| `TipoVenda`             | `NACIONAL`, `INTERNACIONAL`, `TERRESTRE`                                                                                             | `VendaPercentual.tipo`        |
| `EtapaDecisao`          | `ANALISE`, `COMPLEMENTAR`                                                                                                            | `DecisaoHumana.etapa`         |
| `ResultadoDecisao`      | `APROVADO`, `REPROVADO`                                                                                                              | `DecisaoHumana.decisaoHumana` |

`EtapaCadastro` (do schema original) foi removido: os campos que o usavam (`GateValidacao.etapaAlvo`, `AvancoForcado.etapaAlvo`, `KanbanHistorico.etapaAnterior`/`etapaNova`) viraram `Int?`, pra bater com `Agencia.etapaAtual`, que já era `Int` antes do merge.

## Padrão geral do schema

Diferente do sistema de referência original (onde quase todo campo de negócio era nullable, porque o dado chegava incrementalmente ao longo das Etapas 1-3), o fluxo implementado hoje coleta tudo num único submit do wizard público — por isso `Agencia`, `RepresentanteLegal` e `Documento` têm vários campos `NOT NULL` sem default que refletem o que o formulário sempre exige (nome, CPF, e-mail, telefone, estado civil do sócio; razão social, CNPJ, contrato social, e-mail e telefone da agência; tipo e caminho de todo documento). As tabelas do roadmap (`DadosReceita`, `GateValidacao`, `Alerta`, `UsuarioMaster`, CADASTUR/vendas em `CadastroComplementar`, `AvancoForcado`, `KanbanHistorico`, `DecisaoHumana`, `Notificacao`, `SignatarioPadrao`) seguem o padrão antigo — nullable — porque nada as popula ainda.

## Resumo — todos os campos obrigatórios, por tabela

Todo campo listado abaixo é `NOT NULL`. Separado em **sem default** (quem cria a linha precisa informar o valor) e **com default** (o banco/Prisma preenche sozinho se omitido).

| Tabela                    | Obrigatórios sem default                                             | Obrigatórios com default                                                            |
| ------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| users                     | name, email, password                                                | id, createdAt, updatedAt                                                            |
| agencias                  | razaoSocial, cnpj, contratoSocialPath, emailContato, telefoneContato | id, etapaAtual, status, createdAt, updatedAt                                        |
| dados_receita             | agenciaId                                                            | id, optanteSimples, consultadoEm                                                    |
| cnaes                     | dadosReceitaId                                                       | id, principal                                                                       |
| gate_validacoes           | agenciaId                                                            | id, avaliadoEm                                                                      |
| alertas                   | agenciaId                                                            | id, criadoEm                                                                        |
| usuarios_master           | agenciaId                                                            | id, ativo, criadoEm                                                                 |
| enderecos                 | —                                                                    | id                                                                                  |
| cadastros_complementares  | agenciaId                                                            | id, createdAt, updatedAt                                                            |
| venda_percentuais         | cadastroComplementarId                                               | id                                                                                  |
| representantes_legais     | agenciaId, nome, email, telefone, cpf, estadoCivil                   | id, isPj, papel, isRepresentanteLegal, ativo, preenchidoPorIa, createdAt, updatedAt |
| conjuges                  | representanteLegalId                                                 | id                                                                                  |
| documentos                | agenciaId, tipo, gcsPath                                             | id, status, verificado, createdAt, updatedAt                                        |
| analises_ia_documentos    | documentoId                                                          | id, processadoEm                                                                    |
| contratos                 | agenciaId, provedorId, origemGeracao                                 | id, status, leituraConfirmada, createdAt, updatedAt                                 |
| contrato_signatarios      | contratoId, nome, email, cpf                                         | id                                                                                  |
| contrato_campos_pendentes | contratoSignatarioId                                                 | id                                                                                  |
| avancos_forcados          | agenciaId                                                            | id, createdAt                                                                       |
| avanco_forcado_pendencias | avancoForcadoId                                                      | id                                                                                  |
| kanban_historico          | agenciaId                                                            | id, createdAt                                                                       |
| decisoes_humanas          | agenciaId                                                            | id, createdAt                                                                       |
| notificacoes              | agenciaId                                                            | id, createdAt                                                                       |
| signatarios_padrao        | —                                                                    | id, ativo                                                                           |

Só `enderecos` e `signatarios_padrao` não têm nenhum campo obrigatório "sem default" — toda linha pode ser criada só com o que o Prisma preenche automaticamente (mais, no caso de `enderecos`, uma das três FKs de dono, que são todas nullable individualmente mas na prática uma delas deve ser preenchida). `agencias`, ao contrário do schema original, agora tem vários campos obrigatórios sem default — reflexo de o wizard público coletar tudo num único submit em vez de incrementalmente.
