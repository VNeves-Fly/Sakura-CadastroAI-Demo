import { gerarEventosMock } from "@/modules/eventos/mock/eventos-mock.data";

export interface OrigemEventoResolvida {
  eventoNome: string;
  executivoNome: string;
}

// Usado no /painel pra mostrar as tags de Evento/Executivo a partir do
// `Agencia.origem` (hoje uma string solta, ex.: "Evento: summit2026sp-
// joaosilva" — ver finalizar-cadastro.use-case.ts). Como o /eventos ainda
// é 100% mock (sem tabela própria, sem FK em Agencia), a única forma de
// "resolver" o slug de volta pro nome do evento/executivo é comparando
// contra esses mesmos dados mock — funciona pros eventos/links seedados
// aqui, mas não pra um evento criado ao vivo na tela /eventos (aquele
// estado só existe no navegador de quem criou, não é compartilhado).
// Quando o back-end real existir (FK EventoLink em Agencia), troca isso
// por uma consulta de verdade.
const SLUG_PARA_ORIGEM = new Map<string, OrigemEventoResolvida>(
  gerarEventosMock().flatMap((evento) =>
    evento.links.map((link) => [
      link.slug,
      { eventoNome: evento.nome, executivoNome: link.executivoNome },
    ]),
  ),
);

export function resolverOrigemEvento(origem: string | null): OrigemEventoResolvida | null {
  if (!origem) return null;
  const slug = origem.replace(/^Evento:\s*/i, "").trim();
  return SLUG_PARA_ORIGEM.get(slug) ?? null;
}
