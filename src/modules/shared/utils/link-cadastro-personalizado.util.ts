// Link personalizado do cadastro público — sem tabela própria, nenhuma
// escrita no banco: é montado inteiramente client-side a partir de ids/slug
// que já existem (Evento.slug, Promotor.id, Associacao.id). Roda
// client-side (chamado de dentro de GerarLinkModal), então
// window.location.origin é a fonte certa: painel e cadastro público estão
// sempre no mesmo domínio.
export function montarUrlCadastroPersonalizado(params: {
  eventoSlug?: string | null;
  executivoId?: string | null;
  associacaoId?: string | null;
}): string {
  const url = new URL("/cadastro", window.location.origin);
  if (params.eventoSlug) url.searchParams.set("evento", params.eventoSlug);
  if (params.executivoId) url.searchParams.set("executivo", params.executivoId);
  if (params.associacaoId) url.searchParams.set("associacao", params.associacaoId);
  return url.toString();
}
