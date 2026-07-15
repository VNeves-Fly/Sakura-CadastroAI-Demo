# Campos exatos — Link 1 e Link 2

> Anexo do `HANDOFF-SAKURA-CADASTRO.md`. Extraído linha a linha do código
> real (`CadastroForm.tsx`, `CadastroComplementar.tsx`,
> `CadastroComplementarEntry.tsx`, `CadastroParceiro.tsx`) — nada aqui foi
> estimado. Onde algo não estava 100% claro no código-fonte original, está
> sinalizado explicitamente em vez de assumido.
>
> Como você (dev responsável pelo front-end do novo projeto) não cuida do
> backend, use isto como o contrato de dados que a API do módulo
> `cadastro` vai precisar aceitar/retornar — os nomes de campo abaixo são
> os mesmos que devem virar as chaves do payload trocado com o back-end.

---

## LINK 1 — Cadastro de Agência

Arquivos-fonte: `src/pages/CadastroAgencia.tsx`, `src/components/CadastroForm.tsx`, `src/hooks/useCadastroAgencia.ts`.

### Seção 1 — Identificação da agência

| Campo            | Label           | Tipo | Obrigatório | Máscara / validação                                                                                                                                                                                              | Default |
| ---------------- | --------------- | ---- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `cnpj`           | CNPJ da agência | text | Sim         | máscara CNPJ (aceita alfanumérico); dígito verificador módulo-11; erro "CNPJ incompleto. São necessários 14 caracteres." se parcial; erro "CNPJ inválido. Verifique os caracteres digitados." se checksum falhar | `''`    |
| `contratoSocial` | Contrato Social | file | Sim         | `.pdf,.doc,.docx`, single file, drag&drop                                                                                                                                                                        | `null`  |

Efeito colateral: ao completar 14 caracteres do CNPJ, dispara consulta
automática ao QSA da Receita Federal (loader "Consultando QSA na Receita
Federal..."). Se o CNPJ for alfanumérico, mostra aviso amarelo de que a
consulta automática ainda não está disponível pra esse formato.

Inline de validação do CNPJ: ícone + texto verde "CNPJ válido" ou
vermelho com a mensagem de erro específica.

### Seção 2 — Sócios (lista dinâmica)

Lista dinâmica: botão **"Adicionar sócio"** e ícone de lixeira por card
pra remover (só aparece se houver mais de 1 sócio). Começa com 1 sócio
vazio.

| Campo                   | Label                | Tipo                                                                   | Obrigatório | Máscara / validação                                                                                                                              |
| ----------------------- | -------------------- | ---------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `nome`                  | Nome completo        | combobox (se QSA carregado, com opção "+ Inserir manualmente") ou text | Sim         | Validado contra o QSA da Receita por normalização de nome; se divergente, **bloqueia** upload de RG/comprovante e impede o envio do form inteiro |
| `email`                 | E-mail               | email                                                                  | Sim         | formato de e-mail válido                                                                                                                         |
| `telefone`              | Telefone             | tel                                                                    | Sim         | máscara de telefone; mínimo 10 dígitos                                                                                                           |
| `rg` (arquivo)          | RG ou CNH            | file                                                                   | Sim         | `.pdf,.jpg,.jpeg,.png`                                                                                                                           |
| `comprovante` (arquivo) | Comprovante Endereço | file                                                                   | Sim         | mesmo accept                                                                                                                                     |

> `cargo` e `participacao` existem no modelo de dados mas **não têm campo
> de UI** no formulário original — não foi encontrado onde são
> preenchidos. Tratar como campos que podem ficar de fora do form também
> no novo projeto, a menos que o backend precise deles por outro caminho.

Indicadores inline por sócio: badge verde "Confirmado no QSA" / badge
vermelho "Nome não encontrado"; banner vermelho global "Envio bloqueado —
nomes divergentes" quando aplicável.

E-mail e telefone do **primeiro sócio da lista** são espelhados
automaticamente para os campos de contato da agência.

### Seção 3 — Executivo e Associação

| Campo          | Label      | Tipo             | Obrigatório | Detalhe                                                                                                                                    |
| -------------- | ---------- | ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `executivoId`  | Executivo  | combobox (busca) | Não         | opções vêm de uma lista de "promotores públicos"; fica bloqueado (cadeado, disabled) se veio pré-preenchido via query string `?executivo=` |
| `associacaoId` | Associação | combobox (busca) | Não         | opções = associações ativas; bloqueado se veio via `?associacao=`                                                                          |

### Botão de envio

"Cadastrar minha agência" (troca pra "IA processando..." durante envio).
Fica desabilitado até: CNPJ válido **e** contrato social anexado **e**
todos os sócios válidos **e** nenhum sócio divergente do QSA.

### Variante "parceiro" (`CadastroParceiro.tsx`)

Rota tipo `/:slug` — busca o parceiro pelo slug, injeta um "partner tag" e
troca o texto do badge do painel de marca (mostra o nome do parceiro no
lugar do nome do evento). **Não muda nenhum campo do formulário** — só
adiciona um campo de rastreio de origem no payload. Existe uma variante
similar via `?evento=slug` que faz a mesma coisa mostrando "Evento:
{nome}".

### O que o submit faz (contrato de API a replicar)

1. Checa duplicidade por CNPJ antes de gravar.
2. Aplica rate limit (proteção contra spam).
3. Grava o cadastro com status inicial `em_analise` e `etapa_atual` na
   primeira etapa do funil.
4. Sobe os arquivos (contrato social + RG/comprovante de cada sócio) em
   paralelo — se qualquer upload falhar, o cadastro inteiro não é
   confirmado como enviado.
5. Depois de confirmado, dispara (em background, sem bloquear a resposta
   pro usuário): e-mail com o link do Link 2, notificação de WhatsApp, e
   as análises automáticas (consulta CNPJ, análise da agência).
6. Mostra popup de sucesso ("obrigado") ou popup de "Já Cadastrada" se
   detectar duplicidade.

---

## LINK 2 — Cadastro Complementar (wizard de 7 passos)

Arquivo-fonte: `src/pages/CadastroComplementar.tsx`. Labels dos passos:
`Documentos`, `Empresa`, `Comercial`, `Representação`, `Sócios`,
`Endereço & Banco`, `Revisão`.

**Tela de entrada por CNPJ** (`CadastroComplementarEntry.tsx`) — usada
quando a pessoa não tem o link direto: um único campo **CNPJ** (com
máscara), que busca o token de acesso correspondente e redireciona pro
wizard. Se o CNPJ não for encontrado, mostra erro "CNPJ não encontrado".

**Navegação entre os 7 passos**: livre — dá pra ir e voltar sem bloqueio,
inclusive clicando direto numa bolinha do stepper. A validação de campos
obrigatórios só é aplicada de fato **no envio final**, não ao trocar de
passo. Uploads de arquivo são enviados imediatamente ao selecionar (não
esperam o submit). Existe autosave de rascunho (debounce + intervalo
fixo + ao saír da página) com opção de retomar de onde parou ao reabrir o
link.

### Passo 1 — Documentos

| Campo                | Label                      | Tipo | Obrigatório                                           | Detalhe                                                                                                                          |
| -------------------- | -------------------------- | ---- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `contratoSocialFile` | Contrato Social da Empresa | file | Sim (exceto se já houver documento aprovado/pendente) | `.pdf,.jpg,.jpeg,.png`                                                                                                           |
| `cadasturFile`       | Certificado CADASTUR       | file | **Não** (opcional)                                    | Ao subir, dispara análise automática que extrai número, razão social, datas e situação do CADASTUR; se reprovado, mostra motivos |

### Passo 2 — Empresa

| Campo                                             | Label                                                | Tipo                              | Obrigatório                            | Condicional                                              |
| ------------------------------------------------- | ---------------------------------------------------- | --------------------------------- | -------------------------------------- | -------------------------------------------------------- |
| `siteEmpresa`                                     | Site da Empresa                                      | text/url                          | Não                                    | some se `semSite` marcado                                |
| `semSite`                                         | Não possui (site)                                    | checkbox                          | —                                      | —                                                        |
| `telefoneComercial`                               | Telefone Comercial                                   | tel                               | Não (mas valida formato se preenchido) | some se `semTelefoneComercial`                           |
| `semTelefoneComercial`                            | Não possui (telefone)                                | checkbox                          | —                                      | —                                                        |
| `emailOperacional`                                | E-mail responsável operacional                       | email                             | Não (valida formato se preenchido)     | —                                                        |
| `emailComercial`                                  | E-mail setor comercial                               | email                             | idem                                   | botão "Usar o mesmo para todos" replica um dos 3 e-mails |
| `emailFinanceiro`                                 | E-mail setor financeiro                              | email                             | idem                                   | idem                                                     |
| `resideBrasil`                                    | A agência reside no Brasil?                          | botões Sim/Não                    | —                                      | —                                                        |
| `dataAbertura`, `telefoneReceita`, `emailReceita` | Data da Abertura / Telefone Receita / E-mail Receita | somente leitura, badge "Recebido" | —                                      | só aparecem se vierem da consulta à Receita (ReceitaWS)  |

### Passo 3 — Comercial

| Campo        | Label                   | Tipo                                                             | Obrigatório                                                                 |
| ------------ | ----------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `vendasTipo` | Vendas                  | multi-seleção tipo "pills": Nacional / Internacional / Terrestre | Sim — mínimo 1 selecionado                                                  |
| `vendasPerc` | Distribuição percentual | slider + input numérico, um por tipo selecionado                 | A soma tem que fechar em 100% (redistribuição automática ao mudar um valor) |

### Passo 4 — Representação

Escolha binária: "Os próprios sócios serão os representantes legais"
(padrão) **ou** "Indicar um representante terceiro (procurador
externo)". Se optar pelo terceiro, aparecem estes campos condicionais:

| Campo                                            | Label                      | Tipo                                                    | Obrigatório                                                                                                                                                                   | Máscara/validação                 |
| ------------------------------------------------ | -------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `repTerceiro.nome`                               | Nome completo              | text                                                    | Sim                                                                                                                                                                           | —                                 |
| `repTerceiro.cpf`                                | CPF                        | text                                                    | Sim                                                                                                                                                                           | máscara CPF + validação de dígito |
| `repTerceiro.email`                              | E-mail                     | email                                                   | Sim                                                                                                                                                                           | formato válido                    |
| `repTerceiro.telefone`                           | Telefone                   | tel                                                     | Sim                                                                                                                                                                           | máscara + validação               |
| `repTerceiro.nacionalidade`                      | Nacionalidade              | text                                                    | Não                                                                                                                                                                           | default "Brasileiro(a)"           |
| `repTerceiro.estado_civil`                       | Estado Civil               | select (solteiro/casado/divorciado/viuvo/uniao_estavel) | Sim                                                                                                                                                                           | —                                 |
| `repTerceiro.rg`                                 | RG                         | text, máx. 12                                           | Sim                                                                                                                                                                           | —                                 |
| `repTerceiro.rg_orgao`                           | Órgão Emissor (Ex: SSP/UF) | text                                                    | Sim                                                                                                                                                                           | —                                 |
| `repTerceiro.endereco.cep`                       | CEP                        | text + botão buscar                                     | Não                                                                                                                                                                           | busca ViaCEP automática           |
| `repTerceiro.endereco.logradouro`                | Logradouro                 | text                                                    | Sim                                                                                                                                                                           | —                                 |
| `repTerceiro.endereco.numero/complemento/bairro` | —                          | text                                                    | Não                                                                                                                                                                           | —                                 |
| `repTerceiro.endereco.cidade`                    | Cidade                     | text                                                    | Sim                                                                                                                                                                           | —                                 |
| `repTerceiro.endereco.uf`                        | UF                         | text, máx. 2                                            | Sim                                                                                                                                                                           | —                                 |
| RG/CNH (arquivo)                                 | RG ou CNH do representante | file                                                    | Sim                                                                                                                                                                           | —                                 |
| Comprovante de residência (arquivo)              | Comprovante de residência  | file                                                    | Marcado como obrigatório na tela (`*`), **mas não encontrei checagem que de fato bloqueie o envio por causa dele** no código original — decisão de UX a tomar no projeto novo | —                                 |
| Procuração (arquivo)                             | Procuração válida          | file                                                    | mesmo caso acima — obrigatório na tela, sem bloqueio confirmado no código                                                                                                     | analisada por IA no envio final   |

### Passo 5 — Sócios

**Não é uma lista editável pelo usuário** (sem "adicionar/remover
sócio") — é pré-preenchida automaticamente a partir do QSA da Receita
Federal (com fallback de 1 sócio vazio se a Receita não retornar nada). O
usuário só completa/corrige os dados de cada sócio já listado, podendo
alternar entre nome vindo do QSA ou digitado manualmente.

Campos por sócio:

| Campo                                         | Label                                              | Tipo                             | Obrigatório                                    | Detalhe                                                                       |
| --------------------------------------------- | -------------------------------------------------- | -------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `nome`                                        | Nome / Razão Social                                | combobox (QSA) ou text           | Sim                                            | —                                                                             |
| `cargo`                                       | Cargo / Qualificação                               | text (readonly se titular único) | Não                                            | —                                                                             |
| `email`                                       | E-mail do Representante                            | email                            | Sim                                            | —                                                                             |
| `telefone`                                    | Telefone / WhatsApp do Representante               | tel                              | Sim                                            | —                                                                             |
| _(se Pessoa Jurídica)_ `cnpj`                 | CNPJ                                               | text                             | Sim                                            | máscara + validação                                                           |
| _(se PJ)_ `endereco.*`                        | Logradouro/Número/Complemento/Bairro/Cidade/UF     | text                             | Não obrigatório                                | via CEP                                                                       |
| _(se Pessoa Física)_ `nacionalidade`          | Nacionalidade                                      | text                             | Não                                            | default "Brasileiro(a)"                                                       |
| _(se PF)_ `cpf`                               | CPF                                                | text                             | Sim                                            | máscara + validação; **bloqueia CPF duplicado entre sócios da mesma agência** |
| _(se PF)_ `data_nascimento`                   | Data de Nascimento                                 | date                             | Sim                                            | —                                                                             |
| _(se PF)_ `rg`                                | RG                                                 | text, máx. 12                    | Sim                                            | —                                                                             |
| _(se PF)_ `rg_orgao`                          | Órgão Emissor (Ex: SSP/UF)                         | text                             | Sim                                            | —                                                                             |
| RG/CNH (arquivo)                              | RG ou CNH (cópia digitalizada)                     | file                             | Sim, salvo se já existir doc aprovado/pendente | —                                                                             |
| `endereco.*` (PF)                             | CEP/Logradouro/Número/Complemento/Bairro/Cidade/UF | text                             | CEP em si não obrigatório                      | via CEP                                                                       |
| Comprovante de residência (arquivo)           | Comprovante de Residência                          | file                             | Sim, salvo se já existe ou veio de OCR         | mensagem varia se home office                                                 |
| `estado_civil`                                | Estado Civil                                       | select                           | Sim                                            | —                                                                             |
| _(se casado)_ Certidão de casamento (arquivo) | Certidão de Casamento                              | file                             | Sim se casado                                  | análise automática extrai regime de bens e dados do cônjuge                   |
| _(se casado)_ `conjuge.nome`                  | Nome Completo do Cônjuge                           | text                             | Sim se casado                                  | —                                                                             |
| _(se casado)_ `conjuge.cpf`                   | CPF do Cônjuge                                     | text                             | Sim se casado                                  | máscara + validação                                                           |
| _(se casado)_ `conjuge.data_nascimento`       | Data de Nascimento do Cônjuge                      | date                             | Não                                            | —                                                                             |

### Passo 6 — Endereço & Banco

**Agência:**

| Campo                                             | Label                                                           | Tipo                          | Obrigatório                                                                                                                            | Detalhe                                     |
| ------------------------------------------------- | --------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `tipoAgencia`                                     | Tipo de Agência                                                 | select (Física / Home Office) | Sim                                                                                                                                    | —                                           |
| `percCorporativo` / `percConvencional`            | % Corporativo / % Convencional                                  | number (par complementar)     | Não obrigatório individualmente, mas soma validada no envio                                                                            | preencher um auto-calcula o outro (100 − n) |
| Pergunta "endereço = mesmo do sócio?"             | botões Sim/Não                                                  | —                             | se 1 sócio PF, vincula direto; se mais de um, abre modal de escolha                                                                    |
| `enderecoAgencia.cep` + demais campos de endereço | CEP da Agência + Logradouro/Número/Complemento/Bairro/Cidade/UF | text                          | CEP obrigatório exceto se endereço vinculado a um sócio                                                                                | busca ViaCEP manual (botão)                 |
| Comprovante de endereço da agência (arquivo)      | Comprovante de Endereço da Agência                              | file                          | Sim, exceto em casos específicos (home office com só 1 sócio PF, endereço vinculado a sócio, ou todos os sócios sendo "titular único") | —                                           |

**Dados bancários** (obrigatórios só para cadastros criados a partir de
uma certa data no Sakura original — decisão de regra de negócio a
confirmar se replica ou não no projeto novo):

| Campo                 | Label                                            | Tipo                                       | Obrigatório       | Detalhe                                                                               |
| --------------------- | ------------------------------------------------ | ------------------------------------------ | ----------------- | ------------------------------------------------------------------------------------- |
| `bancoNome`           | Banco                                            | select (lista de bancos brasileiros)       | Sim (condicional) | —                                                                                     |
| `bancoAgencia`        | Agência                                          | text, dígitos, min. 3                      | Sim (condicional) | —                                                                                     |
| `bancoConta`          | Conta (com dígito)                               | text, dígitos, min. 3                      | Sim (condicional) | —                                                                                     |
| `tipoConta`           | Tipo de Conta                                    | select (corrente/poupança/pagamento)       | Sim (condicional) | —                                                                                     |
| `tipoChavePix`        | Tipo de Chave PIX (opcional)                     | select (cpf/cnpj/telefone/email/aleatoria) | Não               | —                                                                                     |
| `chavePix`            | Chave PIX (opcional)                             | text                                       | Não               | máscara conforme o tipo escolhido; desabilitado até escolher o tipo                   |
| `favorecidoEhEmpresa` | Favorecido é a própria empresa (CNPJ da agência) | checkbox                                   | —                 | se marcado, auto-preenche nome/documento do favorecido                                |
| `favorecidoNome`      | Nome do Favorecido                               | text                                       | Sim (condicional) | desabilitado se `favorecidoEhEmpresa`                                                 |
| `favorecidoDoc`       | CPF/CNPJ do Favorecido                           | text                                       | Sim (condicional) | valida CPF ou CNPJ conforme o tamanho digitado; desabilitado se `favorecidoEhEmpresa` |

### Passo 7 — Revisão

Não tem campos novos — é um checklist/resumo:

- Banner de pendências não-bloqueantes (documentos ainda não anexados).
- Lista item a item de cada documento esperado (Empresa: Contrato Social,
  CADASTUR; por Sócio: RG/CNH, Comprovante, Certidão se casado), cada um
  com status ok/pendente e origem (já enviado / anexado agora / pendente).
- Botão "Salvar Rascunho".
- Botão final "Enviar Cadastro Complementar".
- **Não existe checkbox de aceite de Termos/Privacidade em nenhum dos dois
  formulários** — no Link 1 os links de Termos ficam só no rodapé da
  página, sem confirmação obrigatória.

### O que o envio final faz (contrato de API a replicar)

1. Bloqueia envio em modo demo/preview.
2. Valida que os percentuais somam 100%.
3. Roda a validação completa; se houver qualquer campo obrigatório
   faltando, mostra toast "N campo(s) obrigatório(s) precisam ser
   corrigidos" e rola até o resumo de erros — **não envia**.
4. Sobe qualquer arquivo ainda pendente.
5. Atualiza os dados de contato dos sócios.
6. Grava tudo num único payload (documentos, vendas, contatos,
   representante, sócios, endereço, dados bancários) — no Sakura original
   isso é uma única operação atômica no banco.
7. Marca o cadastro complementar como enviado (bloqueia reedição, exceto
   com um parâmetro explícito de edição).
8. No primeiro envio, avança o cadastro principal pra próxima etapa do
   funil e gera uma notificação interna.
9. Dispara validações automáticas em background (dados complementares,
   procuração, se houver).
10. Mostra confirmação de sucesso.

---

## Pontos deixados em aberto (decisão do time, não do código)

1. **Passo 4 (Representação)**: comprovante de residência e procuração do
   representante terceiro são marcados como obrigatórios na tela, mas o
   código original não bloqueia o envio se estiverem faltando. Decidir no
   projeto novo se replica esse comportamento (visualmente obrigatório,
   mas não bloqueante) ou corrige pra bloquear de fato.
2. **`cargo`/`participacao` do sócio no Link 1**: existem no modelo de
   dados mas sem campo de UI — decidir se entram no form novo ou ficam de
   fora.
3. **Regra de dados bancários obrigatórios a partir de uma data**: é uma
   regra de negócio com corte temporal específico do Sakura original;
   confirmar com quem for cuidar do backend se essa regra deve ser
   replicada ou se todo cadastro novo já exige dados bancários.
