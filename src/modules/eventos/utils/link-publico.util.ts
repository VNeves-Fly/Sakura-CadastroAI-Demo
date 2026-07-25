// Link personalizado de um EventoLink — sem rota própria, é a própria
// rota pública /cadastro com querystring. Roda client-side (chamado de
// dentro de EventoLinkRow), então window.location.origin é a fonte
// certa: painel e cadastro público estão sempre no mesmo domínio.
export function montarUrlEventoLink(params: {
  eventoId: string;
  promotorId: string | null;
  associacaoId: string | null;
}): string {
  const url = new URL("/cadastro", window.location.origin);
  url.searchParams.set("evento", params.eventoId);
  if (params.promotorId) url.searchParams.set("executivo", params.promotorId);
  if (params.associacaoId) url.searchParams.set("associacao", params.associacaoId);
  return url.toString();
}
