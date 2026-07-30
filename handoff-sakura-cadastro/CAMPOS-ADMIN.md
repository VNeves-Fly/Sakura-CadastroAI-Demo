# Campos e comportamento exatos — Admin (Cadastros + Dossiê da Agência)

> Anexo do `HANDOFF-SAKURA-CADASTRO.md`. Extraído linha a linha de
> `AdminCadastros.tsx`, `AdminEmpresa.tsx`, `Etapa1` a `Etapa5Aprovado.tsx`,
> `ModalForcarAvanco.tsx` e `SicaCard.tsx`. Nada aqui foi estimado — onde o
> código não deixa algo 100% explícito, isso está sinalizado.
>
> Como você cuida só do front-end, trate cada "o que o botão faz" abaixo
> como o contrato de API (endpoint/RPC + payload esperado) que o back-end
> do projeto novo precisa fornecer.

---

## PARTE A — Listagem (`AdminCadastros`)

### A.1 Cards de KPI (linha superior)

| Card | Label                       | O que conta                                                                                                              | Ação ao clicar                           |
| ---- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| Tab  | **Em Análise**              | cadastros com etapa em `ETAPAS_ATIVAS`, excluindo legado/CSV/status finais                                               | filtra a lista pra essa tab              |
| KPI  | **Notificações**            | agências com documento novo, complementar novo ou mensagem de WhatsApp desde a última vez que o analista "viu" a agência | abre painel/lista de novidades           |
| KPI  | **Reprovadas**              | `status = recusado`                                                                                                      | **navega** para Arquivo → aba Rejeitadas |
| KPI  | **Aprovadas**               | `status = aprovado` e já arquivado                                                                                       | **navega** para Arquivo → aba Ativas     |
| KPI  | **Aguard. Aprovação Final** | chegou na Etapa 5 (`etapa_atual = aprovado`) mas `status` ainda não é `aprovado` — ninguém clicou "Ativar agência"       | abre painel lateral com essa lista       |

> A tab **"Desistentes"** existe no código (filtro por `status =
desistente`) mas **não é exibida na UI atual** — hoje só "Em Análise"
> aparece. Decisão do time: replicar as duas abas visíveis, ou manter só
> uma como no original.

### A.2 Funil de Etapas (cards clicáveis, filtro por etapa)

O funil visível vai só até a Etapa 4 — a Etapa 5 (Aprovado) sai da tela de
listagem assim que a agência é arquivada, então não aparece como card do
funil aqui:

| #                    | Label do card                | Sublabel             | Agrupa quais etapas de banco     |
| -------------------- | ---------------------------- | -------------------- | -------------------------------- |
| 1                    | **Etapa 1 · Análise**        | "ficha em análise"   | ficha, validação, análise, dados |
| 2                    | **Etapa 2 · Complementar**   | "docs e complemento" | documentos, complementar         |
| 3                    | **Etapa 3 · Contrato**       | "em assinatura"      | contrato                         |
| 4                    | **Etapa 4 · Usuário Master** | "criar credenciais"  | acessos, credenciais, dossiê     |
| _(5, fora do funil)_ | Etapa 5 · Aprovado           | "agências ativas"    | aprovado — vive só no Arquivo    |

Clicar num card filtra a lista por aquela etapa (clique de novo remove o
filtro).

**Sub-filtros que aparecem só quando a etapa ativa é 2 ou 3:**

- **Etapa 3 (Contrato)**: pills "Todos / Não enviado / Gerado, não
  enviado / Aguardando assinatura / Aguardando Sakura / Assinado /
  Cancelado" — status vem da tabela `contratos`, não de uma coluna solta
  em `cadastros`.
- **Etapa 2 (Complementar)**: pills "Todos / Não enviado / Link enviado /
  Preenchendo / Enviado" + botão **"Enviar e-mail p/ N não enviados"**
  (disparo em massa do e-mail com o link do Link 2 pros que ainda não
  começaram).

### A.3 Colunas da tabela principal

| Coluna                             | Conteúdo                                                                                                                                                              |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agência                            | nome fantasia/razão social, badge "Nova" (&lt;3h), badge de novidades, CNPJ, badges de alerta (CNPJ irregular / CNAE fora do turismo), badge do executivo responsável |
| Atendimento                        | quem está atendendo agora (ou atendeu), com timestamp                                                                                                                 |
| Tag                                | origem/campanha (ex.: `SUMMIT-VIAJAFLUX`, `WTM2026`), badge verde "SICA #..." se já tem código SICA, badge vermelha "DOC VENCIDO" se houver documento vencido         |
| Base                               | sigla da base/região                                                                                                                                                  |
| Etapa                              | badge da etapa atual; fica **vermelho** com tooltip se essa etapa foi resultado de avanço forçado; badge extra "Gate bloqueado"/"Atenção" conforme regras automáticas |
| Contrato _(só na tab Etapa 3)_     | status do contrato + link pro documento assinado                                                                                                                      |
| Complementar _(só na tab Etapa 2)_ | status + "há X dias parado"                                                                                                                                           |
| Cadastro _(só na tab Em Análise)_  | data de criação + "Xd atrás"                                                                                                                                          |

Colunas ordenáveis: Agência, Etapa, Cadastro.

### A.4 Filtros

- **Busca textual** (CNPJ, razão social, nome fantasia ou e-mail) — detecta automaticamente se o texto digitado parece um CNPJ.
- **3 multiselects**: Executivo, Associação, Evento (evento = campanha de origem do cadastro).
- **Funil de etapas** (clique no card, ver A.2).

> Existem no estado do componente original filtros de Analista, Alerta,
> Parado(dias) e Idade — mas **sem controle de UI correspondente**
> encontrado (select/input visível). Ou seja, a lógica de filtro existe
> mas não tem onde o usuário aciona isso na tela — decisão do time se vale
> recriar a UI pra esses filtros no projeto novo ou deixar de fora.

### A.5 Clique numa linha e ações

- Clique na linha **navega** pra página de dossiê da agência (não é um
  painel/modal) — equivalente a `/admin/empresa/{id}`. Marca a agência
  como "vista" (zera o badge de novidades) nesse mesmo clique.
- Ctrl/Cmd+clique (ou clique do meio) abre em nova aba.
- **Não há botões de aprovar/reprovar na listagem** — essas decisões só
  acontecem dentro do dossiê (Parte B).
- Botão "Enviar e-mail p/ N não enviados" (ver A.2) é a única ação em
  massa de fato visível e funcional na listagem original.
- Exclusão permanente de cadastro existe, com confirmação.

> Há também, no código original, uma barra de seleção múltipla
> ("N selecionada(s)" + botão Limpar) e um Sheet de preview rápido da
> agência — mas os gatilhos de UI que os abririam (checkboxes por linha,
> botão que abre o preview) não foram encontrados no trecho renderizado.
> Tratar como funcionalidade "pela metade" no original — não recriar
> checkbox de seleção em massa a menos que o time decida implementá-la de
> verdade (a função de mover em lote existe, só falta o botão).

---

## PARTE B — Dossiê da agência (5 etapas)

Layout do dossiê: cabeçalho com status, badge de código SICA, botão
"Atendimento" (abre conversa de WhatsApp), pills editáveis de
Base/Gestor/Executivo/Contato, e um card de resumo (IA) sempre visível
acima do stepper de 5 etapas.

**Importante para o front-end**: a navegação entre as 5 abas do stepper é
**livre** — clicar em qualquer etapa abre ela, sem bloqueio de UI. A
única trava de navegação é um "sair sem salvar?" na Etapa 4 se houver
dados digitados e não salvos. Toda a validação de negócio de fato
acontece nos botões de ação de cada etapa, não na navegação entre elas.

### Etapa 1 — Análise

**O que mostra:** dados que a agência informou (e-mail, telefone, origem,
data), status do CNPJ e CNAE vindos da Receita Federal (com badge
Compatível/Fora do turismo), ficha completa de registro (razão social,
nome fantasia editável, porte, natureza jurídica, Simples/MEI, capital
social, endereço), contatos da Receita, e a lista de sócios (QSA).

**Botões:**

- **Reconsultar Receita** — força nova consulta.
- **Avançar para Etapa 2 e enviar link** — grava a etapa como
  "complementar" e dispara (via trigger de backend) o e-mail com o link
  do Link 2.
- **Aprovar** (com justificativa obrigatória, mínimo 20 caracteres) —
  usado quando o CNPJ/CNAE não passou automaticamente mas um humano
  decide liberar mesmo assim.
- **Reprovar** (com motivo obrigatório, mínimo 20 caracteres) — encerra o
  cadastro (`recusado`), dispara e-mail de reprovação.

**Regra de transição (1→2):** a promoção "normal" é automática (regra de
CNAE compatível + CNPJ ativo, resolvida no backend) — o front só oferece
os botões manuais de avançar/aprovar/reprovar. Não há checklist de campos
obrigatórios bloqueando aqui: a decisão é humana e discricionária.

### Etapa 2 — Complementar (a mais rica em conteúdo)

**O que mostra:** checks de reputação (SOFIA/AMAT — Serasa/Crednet), aviso
se agência é home office sem sócio vinculado ao endereço, todos os dados
da empresa vindos do Link 2 (editáveis inline), os 3 documentos da
empresa (Contrato Social, comprovante de endereço, CADASTUR), uma seção
por sócio/representante com os documentos dele, um checklist de
follow-up de cobrança (solicitação enviada / lembretes / notificação
interna após 3 dias), um "Parecer IA" consolidado, e um banner unificado
de documentos pendentes com seleção em lote pra solicitar reenvio.

**Botões principais:**

- **Editar** (inline, em quase todo campo).
- **Extrair com IA** / **Reanalisar documento** — reprocessa um documento
  específico.
- **Enviar arquivo em nome do cliente** — upload feito pelo analista.
- **Confirmar** / **Rejeitar** documento — é essa decisão, documento por
  documento, que alimenta a regra de transição abaixo. Rejeitar permite
  reenviar (dispara aviso por WhatsApp).
- **Solicitar documentos pendentes** — e-mail de cobrança.
- **Abrir Parecer IA / Reanalisar**.
- **Enviar/Reenviar Solicitação Complementar** — gera novo link de acesso
  ao Link 2 e reenvia por e-mail.
- **Decisão final — "Aprovar e seguir"**: se tudo estiver confirmado,
  confirmação simples; se faltar algo, abre o modal de **Forçar avanço**
  (exige login e senha de um usuário Diretor/Admin).
- **Decisão final — "Reprovar"**: motivo obrigatório, mínimo 20
  caracteres.

**Regra de transição (2→3), explícita:** só libera o "Aprovar e seguir"
direto quando **todos** os documentos obrigatórios foram enviados **e**
cada um deles recebeu "Confirmar" manual do analista. Se faltar qualquer
documento ou confirmação, o único caminho é o **Forçar avanço** — modal
com justificativa (mín. 20 caracteres) + login/senha de Diretor/Admin,
validado no backend. Um avanço forçado fica registrado e visível como
alerta persistente na tela até a pendência real ser resolvida.

### Etapa 3 — Contrato

**O que mostra:** card de código SICA (obrigatório antes de gerar
contrato), fila de assinatura na ordem real (quem já assinou / quem está
na vez / quem aguarda), dados da empresa e bancários usados no contrato,
seção de signatários da própria agência (Fase 1) e depois da Sakura (Fase
2, só libera depois da Fase 1 completa), histórico de contratos gerados
(incluindo cancelados), PDF assinado pra download quando existir, e um
checkbox **"TravelLink Criado"**.

**Botões:**

- **Gerar Contrato** — só disponível com o código SICA preenchido; pode
  ser bloqueado se faltar campo obrigatório (com opção de gerar mesmo
  assim).
- **Revisar e Enviar** → **Enviar para assinatura** (D4Sign).
- **Atualizar status** / **Cancelar** (assinatura no D4Sign).
- **Extrair Todos** — extrai dados dos signatários via IA.
- **Marcar/desmarcar "TravelLink Criado"**.
- **Avançar para Credenciais** — só normal se o contrato estiver
  totalmente assinado.
- **Forçar avanço** (Diretor/Admin).

**Regra de transição (3→4), explícita e importante:** o botão normal de
avançar exige `contrato assinado` **E** `TravelLink Criado` marcado.
**O "TravelLink Criado" é obrigatório mesmo no Forçar avanço** — esse
caminho só dispensa a exigência de assinatura completa, nunca a do Travel
Link (isso está comentado explicitamente no código original como uma
regra de negócio deliberada).

### Etapa 4 — Usuário Master

**O que mostra:** se o contrato ainda não estiver assinado, a tela
aparece bloqueada (overlay), com opção de desbloqueio manual temporário
(não persiste) ou banner se veio de avanço forçado. Card de atribuição da
carteira (região/gestor/executivo, editável). Card de "Login Master": o
analista escolhe qual sócio pessoa física será o usuário master, e
preenche/confirma 7 campos: **nome completo, e-mail, CPF, RG, órgão
emissor, data de nascimento, telefone**. Card de código SICA (compartilha
os mesmos dados da Etapa 3).

**Botões:**

- **Extrair com IA** — preenche os 7 campos a partir de documentos.
- **Salvar** — grava os dados; se divergirem dos dados já cadastrados na
  ficha, pede confirmação antes; depois de salvo os campos ficam
  bloqueados pra edição.
- **Limpar** (só localmente, não apaga nada salvo).
- **Copiar tudo / copiar campo** (clipboard).
- **Solicitar ao cliente** — e-mail pedindo os dados que faltam.
- **Forçar avanço** (Diretor/Admin) — **atenção**: esse forçar só move a
  etapa pra "aprovado", ele **não ativa a agência de verdade** (isso só
  acontece no botão da Etapa 5). Essa distinção é explícita no código
  original como correção de um bug relatado.

**Regra de transição (4→5):** no fluxo normal, o avanço acontece
automaticamente (regra de backend) no momento em que o Login Master é
salvo pela primeira vez — não existe um botão de "avançar" nesta etapa no
fluxo normal, só o de forçar.

### Etapa 5 — Aprovado (finalização)

A mais simples das 5 — um único card: **"Finalizar onboarding — Ativar
agência"**.

**Regra de ativação, explícita — só 3 condições** (nota do código
original: contrato assinado e documentos pendentes **não** bloqueiam mais
aqui, isso já foi resolvido nas etapas anteriores):

1. Código **SICA** preenchido.
2. **TravelLink Criado** marcado.
3. **Usuário Master** com dados salvos.

**Botão "Ativar agência":** sempre clicável — abre um checklist mostrando
✓/✗ pra cada uma das 3 condições. Se as 3 passarem, grava a ativação de
fato (status final, `ativo_sistema=true`, datas de ativação/arquivamento)
e leva pra aba "Ativas" do Arquivo. Se faltar algo, o clique só mostra o
que falta — não existe "forçar" nesta etapa (o único forçar relacionado é
o da Etapa 4, que move a etapa mas não ativa).

---

## Padrões que se repetem entre etapas (importantes pro front-end)

1. **Modal de "Forçar avanço"** é o mesmo componente reusado nas 3
   transições que podem ser puladas (2→3, 3→4, 4→5-etapa): sempre pede
   justificativa (mín. 20 caracteres) **e** login+senha de um usuário
   Diretor/Admin, validados pelo backend — nunca só no cliente. Vale
   construir esse modal como componente único reutilizável no projeto
   novo também.
2. **Card de código SICA** é o mesmo componente/dado compartilhado entre
   Etapa 3 e Etapa 4 (mesma informação, duas telas).
3. **Fonte de verdade do contrato** é um registro de contrato separado
   (não um campo solto no cadastro da agência) — o status do contrato
   (rascunho/enviado/assinado/cancelado) vem desse registro.
4. Praticamente toda etapa segue o padrão: **seções de dados (editáveis
   inline) + documentos com Confirmar/Rejeitar + decisão final com
   aprovar/reprovar/forçar**. Vale desenhar um componente de "seção de
   etapa" genérico no projeto novo em vez de recriar o padrão 5 vezes.

## Pontos deixados em aberto (decisão do time, não do código)

1. Tab "Desistentes" e os filtros de Analista/Alerta/Parado/Idade existem
   na lógica original mas sem UI visível — decidir se entram no projeto
   novo ou ficam de fora.
2. O Sheet de preview rápido da agência (ao lado da navegação pro dossiê
   completo) parece ter existido mas o gatilho de abertura não foi
   encontrado — decidir se vale a pena recriar esse atalho.
3. Seleção em massa (checkboxes por linha) parece incompleta no original
   — decidir se implementa de fato no projeto novo.
