# Schema do banco de dados

Documentação de `prisma/schema.prisma`: o que cada tabela representa, como
elas se relacionam, e por que o modelo é assim. Cobre o domínio de cadastro
de agências — hoje implementado ponta a ponta (Ficha pública → Complementar
→ Contrato) em cima do model `Agencia` — com as tabelas do roadmap de
[`etapas/README.md`](../etapas/README.md) já presentes no schema, nullable,
para quando o fluxo completo (gate de IA, kanban, credenciais...) for
implementado.

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

## Implementado vs. roadmap

Nem toda tabela do schema é populada pela UI de hoje. As que têm comentário
"roadmap" no `schema.prisma` existem prontas pro fluxo descrito em
`etapas/README.md` (gate de IA, CADASTUR, kanban, decisões humanas, avanços
forçados, notificações, signatários padrão), mas nenhuma tela ou use case
atual escreve nelas — ficam totalmente nullable pra não travar o fluxo
implementado.

| Grupo                                | Tabelas                                                                                                                                                                                                                                                           |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Núcleo implementado**              | `Agencia`, `CadastroComplementar`, `RepresentanteLegal`, `Endereco`, `Documento`, `Contrato`, `ContratoSignatario`                                                                                                                                                |
| **Roadmap (existem, não populadas)** | `DadosReceita`, `Cnae`, `GateValidacao`, `Alerta`, `UsuarioMaster`, `Conjuge`, `VendaPercentual`, `AnaliseIaDocumento`, `AvancoForcado`, `AvancoForcadoPendencia`, `KanbanHistorico`, `DecisaoHumana`, `Notificacao`, `SignatarioPadrao`, `ContratoCampoPendente` |

Dentro do núcleo implementado também há colunas roadmap (CADASTUR e vendas
percentuais dentro de `CadastroComplementar`, por exemplo) — sinalizadas
tabela a tabela abaixo.

## Visão geral das relações

```
Agencia (1) ──1:1── CadastroComplementar ──1:N── VendaPercentual [roadmap]
   │                      │
   │                      ├─1:1── Endereco (endereço da agência)
   │                      └─N:1── RepresentanteLegal (sócio vinculado ao endereço)
   │
   ├─1:N── RepresentanteLegal ──1:1── Endereco (endereço do sócio)
   │            │                └─1:1── Conjuge [roadmap]
   │            └─1:N── Documento
   │
   ├─1:N── Documento ──1:1── AnaliseIaDocumento [roadmap]
   │
   ├─1:N── Contrato ──1:N── ContratoSignatario ──1:N── ContratoCampoPendente [roadmap]
   │            (signatário = RepresentanteLegal OU SignatarioPadrao [roadmap])
   │
   ├─1:1── DadosReceita ──N:1── Cnae            [roadmap]
   │            └─1:1── Endereco (endereço da Receita)
   ├─1:N── GateValidacao                        [roadmap]
   ├─1:N── Alerta                               [roadmap]
   ├─1:1── UsuarioMaster                        [roadmap]
   ├─1:N── AvancoForcado ──1:N── AvancoForcadoPendencia   [roadmap]
   ├─1:N── KanbanHistorico                      [roadmap]
   ├─1:N── DecisaoHumana                        [roadmap]
   └─1:N── Notificacao                          [roadmap]

SignatarioPadrao (standalone, sem FK para Agencia) ──1:N── ContratoSignatario   [roadmap]
```

`Endereco` é um model reaproveitado por três donos distintos e mutuamente
exclusivos: o endereço da consulta à Receita (`DadosReceita`), o endereço da
agência (`CadastroComplementar`) e o endereço de cada sócio
(`RepresentanteLegal`). Em vez de repetir `cep`/`logradouro`/`numero`/... em
três tabelas, o FK único (`@unique`) fica do lado do **Endereco**, apontando
pro dono — não o contrário. Isso é proposital: um FK só cascateia do lado
referenciado para quem referencia, nunca ao contrário; se o dono guardasse
`enderecoId`, apagar o dono (ex.: via cascade a partir de `Agencia`) nunca
apagaria o `Endereco` associado, deixando a linha órfã pra sempre. Com o
FK invertido, `onDelete: Cascade` em cada uma das três relações garante que
apagar o dono limpa o endereço junto. Exatamente um dos três
`*Id` deve estar preenchido por linha — não expresso como `CHECK` porque o
Prisma não suporta isso nativamente; é responsabilidade de quem cria o
`Endereco` (sempre via nested write dentro da criação do dono) preencher só
um.

## Tabelas

### `Agencia` (`agencias`)

Entidade central — uma linha por agência em processo de cadastro. É criada
já no submit do wizard público (Ficha + Complementar em um único fluxo),
por isso os campos básicos são obrigatórios, não nullable: o formulário já
garante que existem antes de chegar ao banco.

| Campo                                                            | Tipo                                        | Notas                                                                                                                                              |
| ---------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `razaoSocial`, `cnpj` (único), `emailContato`, `telefoneContato` | `String`                                    | dados básicos, sempre preenchidos pelo wizard                                                                                                      |
| `contratoSocialPath`                                             | `String`                                    | caminho do contrato social já upado no submit (coluna direta, não passa por `Documento`)                                                           |
| `etapaAtual`                                                     | `Int` (default `1`)                         | passo do wizard, sem enum — o conjunto de passos ainda muda com frequência                                                                         |
| `status`                                                         | enum `StatusAgencia` (default `em_analise`) | ver ciclo de vida abaixo                                                                                                                           |
| `origem`                                                         | `String?`                                   | rastreio de origem do pré-cadastro: slug de parceiro ou campanha/evento (`?evento=slug`); só exibido como tag no Admin, não afeta regra de negócio |

**Ciclo de vida (`StatusAgencia`)** — decisão de produto de 2026-07-16,
documentada também em `agencia-repository.ts`:

1. `em_analise` — valor default do schema para quando o gate automático de
   IA (roadmap) avaliar o cadastro antes de qualquer intervenção humana;
   nenhum use case atual grava esse valor.
2. `em_complementar` — IA reprovou (ou o gate roadmap ainda não existe, que
   é o caso hoje), sem contrato gerado; analista revisa manualmente. É o
   status inicial real gravado por `FinalizarCadastroUseCase` quando o
   cadastro não gera contrato automaticamente.
3. `aguardando_assinatura` — contrato gerado (pela IA ou por um analista,
   ver `origemGeracao` em `Contrato`) e enviado; aguardando os sócios
   assinarem. Também pode ser o status inicial se o contrato já sai pronto
   no submit.
4. `aguardando_validacao` — contrato assinado; analista precisa validar o
   contrato assinado antes de liberar a ativação.
5. `aguardando_ativacao` — validado; falta só SICA/TravelLink/Usuário
   Master (roadmap, não implementados) e clicar em ativar.
6. `ativo` / `recusado` — estados finais.

### `CadastroComplementar` (`cadastros_complementares`) — 1:1 com `Agencia`

Dados complementares coletados no mesmo wizard (empresa, comercial,
endereço da agência e dados bancários).

- **Empresa:** `telefoneComercial`, `emailOperacional`, `emailComercial`, `emailFinanceiro`
- **CADASTUR** [roadmap — não coletado pela UI atual]: `cadasturNumero`, `cadasturDataCadastro`, `cadasturValidade`, `cadasturSituacao`
- **Comercial** [roadmap]: `resideBrasil`. `clienteInternacional` não existe como coluna — é sempre o inverso de `resideBrasil`, derivado na camada de aplicação, nunca armazenado (evita as duas gravações dessincronizáveis que existiam no sistema de referência)
- **Endereço da agência & Banco:** `tipoAgencia`, `enderecoAgencia` (relação `Endereco`), `enderecoAgenciaMesmoTitular`, `socioVinculadoEndereco` (FK real para o `RepresentanteLegal` cujo endereço foi copiado), dados bancários com suporte a conta internacional: `bancoPais`, `bancoNome`, `bancoAgencia`, `bancoConta`, `bancoSwift`, `tipoConta`, `favorecidoEhEmpresa`, `favorecidoNome`, `favorecidoDoc`
- **Pagamento** [roadmap, schema antigo]: `chavePix`, `tipoChavePix`, `tipoFaturamento`, `percCorporativo`/`percConvencional` (`Decimal(5,2)`)
- `submetidoAt` — presença desse timestamp é o que bloqueia reedição pelo link público

### `VendaPercentual` (`venda_percentuais`) — N:1 com `CadastroComplementar` [roadmap]

Substitui os dois JSONs paralelos `vendas_tipo`/`vendas_percentuais` do
sistema original. Uma linha por `tipo` (`TipoVenda`:
`NACIONAL`/`INTERNACIONAL`/`TERRESTRE`) com seu `percentual`.
`@@unique([cadastroComplementarId, tipo])` impede duplicar o mesmo tipo. A
regra "soma 100%" é validação de aplicação, não constraint de banco.

### `RepresentanteLegal` (`representantes_legais`) — N:1 com `Agencia`

Sócios (PF ou PJ) **e** procurador/representante terceiro num único model,
diferenciados pelo campo `papel` (`SOCIO` | `PROCURADOR`). `nome`, `email`,
`telefone`, `cpf`, `estadoCivil` são obrigatórios — o wizard sempre coleta
esses dados de cada sócio antes do submit. `cnpj` (sócio PJ), `isPj`, `rg`,
`rgOrgaoEmissor`, `dataNascimento`, `regimeBens`, `nacionalidade`, `cargo`
seguem opcionais.

`isRepresentanteLegal` marca o sócio escolhido como representante legal da
empresa no wizard (libera o slot de upload de Procuração) — é distinto de
`papel`, que é para um procurador terceiro fora do quadro societário
(esse caminho continua roadmap, não usado hoje). `origem` registra de onde
veio o registro (`'qsa_receita'` | `'manual'` | `'procuracao'`),
`preenchidoPorIa` marca preenchimento automático.

`@@unique([agenciaId, cpf])`: `NULL` em `cpf` não conflita entre si no
Postgres, então sócios PJ (que usam `cnpj` no lugar) continuam podendo
repetir no mesmo cadastro; a unicidade só entra em vigor quando o CPF é de
fato preenchido.

### `Conjuge` (`conjuges`) — 1:1 com `RepresentanteLegal` [roadmap]

Dados do cônjuge quando `estadoCivil = 'casado'`; não coletado pela UI
atual. `nome?`, `cpf?`, `rg?`, `nacionalidade?`.

### `Endereco` (`enderecos`)

Compartilhado por três donos (ver seção acima). `cep`, `logradouro`,
`numero`, `complemento?`, `bairro`, `cidade`, `uf` — todos opcionais na
tabela em si porque o dono é quem decide se o endereço é obrigatório.

### `Documento` (`documentos`) — N:1 com `Agencia`, opcionalmente com `RepresentanteLegal`

Todo upload de arquivo do fluxo passa por aqui. `tipo` (enum
`TipoDocumento`: `CONTRATO_SOCIAL`, `CADASTUR`, `RG_CNPJ`,
`COMPROVANTE_ENDERECO`, `COMPROVANTE_ENDERECO_AGENCIA`,
`CERTIDAO_CASAMENTO`, `PROCURACAO`) e `gcsPath` são obrigatórios — todo
documento upado tem tipo e caminho conhecidos. `gcsPath` guarda o caminho
retornado pelo `FileStorage` (`LocalFileStorage` hoje, GCS futuramente);
`gcsBucket`/`gcsSize`/`gcsMd5` ficam nullable porque o storage local atual
não produz esses metadados. `representanteLegalId` é FK real (não nome em
texto) para o sócio dono do documento.

Fluxo de aprovação: `status` (`PENDENTE`/`APROVADO`/`REPROVADO`),
`verificado`, `reprovadoPor`, `motivoReprovacao`, `reprovadoEm`.

### `AnaliseIaDocumento` (`analises_ia_documentos`) — 1:1 com `Documento` [roadmap]

Extração automática via IA sobre um documento (hoje: CADASTUR); não
populada pela UI atual. `numeroCadastur`, `razaoSocialExtraida`,
`dataCadastroExtraida`, `dataValidadeExtraida`, `situacaoExtraida`,
`cnaeExtraido`, `scoreConfianca` (`Decimal(5,2)`).

### `Contrato` (`contratos`) — N:1 com `Agencia`

Uma agência pode ter mais de um contrato ao longo do tempo (regeração); a
aplicação lê o mais recente. `provedorId` identifica o provedor de
assinatura eletrônica de forma genérica (não amarrado a um fornecedor
específico). `status` (enum `StatusContrato`: `aguardando_assinatura` |
`assinado`) controla só o ciclo "gerado → assinado" do próprio contrato,
independente do `status` da `Agencia`. `origemGeracao` (enum
`OrigemGeracaoContrato`: `ia` | `humano`) registra se o contrato foi gerado
automaticamente ou por um analista.

`numContrato` (único), `conteudoPreenchido` (`@db.Text` — texto grande do
PDF renderizado, não estruturado), `leituraConfirmada*`,
`contratoGcsPath` (rascunho/preview) vs. `pdfAssinadoGcsPath` (PDF final
assinado), `assinadoAt`.

### `ContratoSignatario` (`contrato_signatarios`) — N:1 com `Contrato`

Uma linha por signatário, com um **snapshot imutável** dos dados no
momento da geração do contrato: `nome`, `email`, `cpf` obrigatórios;
`rg`, `rgOrgaoEmissor`, `cargo`, `nacionalidade`, `estadoCivil`,
`dataNascimento` e o endereço como colunas `*Snapshot` soltas (não uma
relação para `Endereco`). Proposital: se o sócio corrigir o endereço em
`RepresentanteLegal` depois de o contrato já ter sido gerado, o contrato
já emitido não muda retroativamente.

`representanteLegalId` ou `signatarioPadraoId` (exatamente um dos dois,
sendo o segundo ainda roadmap) identifica quem é o signatário.

### `ContratoCampoPendente` (`contrato_campos_pendentes`) — N:1 com `ContratoSignatario` [roadmap]

Uma linha por campo obrigatório ausente naquele signatário quando o
contrato foi gerado com `force: true` ("Gerar mesmo assim"); não usado
hoje.

### `DadosReceita` (`dados_receita`) — 1:1 com `Agencia` [roadmap]

Cache normalizado da consulta à Receita Federal por CNPJ; não populado
pelo fluxo atual. `situacaoCadastral`, `dataAbertura`, `naturezaJuridica`,
`porte`, `capitalSocial` (`Decimal`, nunca `Float` — dinheiro não é ponto
flutuante), `telefone`, `email`, `optanteSimples` + `dataOpcaoSimples`,
`endereco` (relação), `consultadoEm`.

### `Cnae` (`cnaes`) — N:1 com `DadosReceita` [roadmap]

CNAE principal e secundários, um código por linha, `principal: Boolean`
marca o principal — permitiria `WHERE codigo IN (...)` pro check de
compatibilidade com turismo sem parsear JSON, quando implementado.

### `GateValidacao` (`gate_validacoes`) — N:1 com `Agencia` [roadmap]

Resultado do gate automático que bloquearia/liberaria a transição entre
etapas. Uma linha por avaliação (`etapaAlvo`, `liberado`,
`motivoBloqueio`, `avaliadoEm`) — histórico por natureza, nunca
sobrescrito. Hoje a decisão da IA no fluxo implementado mora só em
`origemGeracao`/`status` do `Contrato`, não aqui.

### `Alerta` (`alertas`) — N:1 com `Agencia` [roadmap]

Alertas levantados durante a análise (ex.: CNAE incompatível, CNPJ
inativo). `tipo`, `mensagem`, `criadoEm`, `resolvidoEm?`. Não referenciada
em nenhum use case hoje.

### `UsuarioMaster` (`usuarios_master`) — 1:1 com `Agencia` [roadmap]

Credencial de acesso provisionada ao final do fluxo de contrato, consumida
pela Etapa 4 (Usuário Master) — fora do escopo implementado hoje. `nome?`,
`email?`, `ativo`, `criadoEm`.

### `AvancoForcado` (`avancos_forcados`) — N:1 com `Agencia` [roadmap]

Uma linha por solicitação de avanço forçado de etapa (`etapaAlvo`,
`motivo`, `gateMotivoBloqueio`, `statusReal`, `solicitadoPor`,
`autorizadoPor`), preservando o histórico de overrides — não usado hoje.

### `AvancoForcadoPendencia` (`avanco_forcado_pendencias`) — N:1 com `AvancoForcado` [roadmap]

Uma linha por pendência ignorada naquele override específico.

### `KanbanHistorico` (`kanban_historico`) — N:1 com `Agencia` [roadmap]

Log de auditoria de toda transição de etapa: `etapaAnterior?`,
`etapaNova?` (ambos `Int?`, sem enum), `usuarioEmail?`, `origem?`,
`observacao?`, `desbloqueioManual?`, `detalhes` (`@db.Text`). Não usado
hoje — o admin já grava `status` diretamente em `Agencia`, sem log próprio
ainda.

### `DecisaoHumana` (`decisoes_humanas`) — N:1 com `Agencia` [roadmap]

Decisão de aprovação/reprovação manual em qualquer etapa com gate humano.
`etapa` (enum `EtapaDecisao`: `ANALISE`/`COMPLEMENTAR`), `decisaoIa?`,
`decisaoHumana` (enum `ResultadoDecisao`: `APROVADO`/`REPROVADO`),
`justificativa` (`@db.Text`), `usuarioEmail?`, `modeloIa?`, `scoreIa?`,
`divergiu?`. Não usado hoje — a aprovação manual do fluxo implementado
mora em `AprovarCadastroComplementarUseCase`, sem log próprio ainda.

### `Notificacao` (`notificacoes`) — N:1 com `Agencia` [roadmap]

`tipo?`, `titulo?`, `mensagem?`, `createdAt`. Não usado hoje.

### `SignatarioPadrao` (`signatarios_padrao`) [roadmap]

Única tabela sem FK para `Agencia` — signatários fixos da Sakura (mesmos
em todo contrato), não algo por agência. `ativo` + `ordem` definiriam
quais entram e em que sequência no contrato. Hoje contratos só têm
signatários ligados aos sócios (`RepresentanteLegal`).

## Enums

| Enum                    | Valores                                                                                                                              | Onde é usado                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| `StatusAgencia`         | `em_analise`, `em_complementar`, `aguardando_assinatura`, `aguardando_validacao`, `aguardando_ativacao`, `ativo`, `recusado`         | `Agencia.status`                        |
| `StatusContrato`        | `aguardando_assinatura`, `assinado`                                                                                                  | `Contrato.status`                       |
| `OrigemGeracaoContrato` | `ia`, `humano`                                                                                                                       | `Contrato.origemGeracao`                |
| `TipoDocumento`         | `CONTRATO_SOCIAL`, `CADASTUR`, `RG_CNPJ`, `COMPROVANTE_ENDERECO`, `COMPROVANTE_ENDERECO_AGENCIA`, `CERTIDAO_CASAMENTO`, `PROCURACAO` | `Documento.tipo`                        |
| `StatusDocumento`       | `PENDENTE`, `APROVADO`, `REPROVADO`                                                                                                  | `Documento.status`                      |
| `PapelRepresentante`    | `SOCIO`, `PROCURADOR`                                                                                                                | `RepresentanteLegal.papel`              |
| `TipoVenda`             | `NACIONAL`, `INTERNACIONAL`, `TERRESTRE`                                                                                             | `VendaPercentual.tipo` [roadmap]        |
| `EtapaDecisao`          | `ANALISE`, `COMPLEMENTAR`                                                                                                            | `DecisaoHumana.etapa` [roadmap]         |
| `ResultadoDecisao`      | `APROVADO`, `REPROVADO`                                                                                                              | `DecisaoHumana.decisaoHumana` [roadmap] |

Campos como `estadoCivil`, `tipoConta`, `tipoChavePix`, `tipoFaturamento`
ficaram como `String` livre em vez de enum: os docs de `etapas/` citam
esses campos mas não fecham o conjunto de valores válidos, e inventar um
enum sem essa confirmação arriscaria rejeitar valores reais do domínio.
Vale endurecer para enum assim que o conjunto de valores for confirmado.

## O que ficou de fora de propósito

- **Tabela de staff/usuários internos** (gestor, executivo, promotor
  responsáveis) — os docs de `etapas/` mencionam esses papéis mas não
  detalham a tabela que eles referenciam, então não entraram no schema
  como FK para um model inventado.
- **Fluxo completo de credenciais (Etapa 4/5)** — `UsuarioMaster` existe
  em forma mínima só porque o fim do fluxo de contrato provisiona esse
  acesso; o restante (login, permissões) não foi modelado.
