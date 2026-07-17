# Integrações externas — chamadas reais testadas

Cada arquivo documenta uma integração externa do backend de cadastro: a chamada exata feita (método, URL, headers, body) e a resposta real recebida em teste, com status code. Não são exemplos inventados — são request/response reais capturados rodando o código contra as APIs de verdade (algumas em produção, ver avisos em cada arquivo).

| Arquivo                        | Integração                                     | Ativa quando                          |
| ------------------------------ | ---------------------------------------------- | ------------------------------------- |
| [gcs.md](./gcs.md)             | Google Cloud Storage (upload de arquivos)      | `GCS_BUCKET_NAME` configurada         |
| [receitaws.md](./receitaws.md) | ReceitaWS (consulta CNPJ/QSA)                  | `RECEITAWS_API_TOKEN` configurada     |
| [d4sign.md](./d4sign.md)       | D4Sign (geração/envio de contrato + webhook)   | `D4SIGN_TOKEN_API` configurada        |
| [flysakura.md](./flysakura.md) | Agente de análise de IA (agents.flysakura.com) | `AGENCY_ANALYSIS_API_KEY` configurada |

Todas caem pro respectivo mock (`Mock*Service`, em `src/modules/cadastro/infrastructure/adapters/`) quando a env correspondente não está configurada — ver comentário no topo de `cadastro-publico.controller.ts` (composition root).

E-mails e nomes de signatários reais usados em testes do D4Sign foram mascarados nos exemplos por privacidade; CPFs de teste são valores fictícios (nunca de pessoas reais).
