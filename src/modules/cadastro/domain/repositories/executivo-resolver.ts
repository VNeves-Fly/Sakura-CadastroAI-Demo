// Porta que traduz o valor cru do parâmetro `?executivo=` do cadastro
// público pro id real do Promotor (Agencia.executivoId) — sem o módulo
// `cadastro` depender do domínio Promotor de `atribuicoes` (mesma
// separação de módulos já usada pro resto do repositório de Agencia).
// O valor cru pode ser: o próprio Promotor.id (link de Evento, escolhido
// num combobox) ou um uuid pessoal de `Promotor.linkExecutivoId[]` (link
// pessoal de promotor, mecanismo mais antigo).
export interface ExecutivoResolver {
  resolve(rawValue: string): Promise<string | null>;
}
