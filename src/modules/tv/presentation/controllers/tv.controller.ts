import { tvSstService } from "@/modules/tv/services/tv.sst-service";
import { tvDadosVazios } from "@/modules/tv/utils/tv-vazio.util";

// Ponto único que a Server Component (page.tsx) e a API route de
// polling (/api/tv/dados) chamam — mesmo padrão do
// dashboardVendasController. Mesmo critério real↔vazio do resto do
// projeto: com SST_API_KEY configurada, usa o serviço real (que já cobre
// vendas/aereo/terrestre/shareAereo/top10 via SST — ver tv.sst-service.ts
// — com fallback por bloco pro "0/vazio honesto" se algum endpoint
// falhar). Sem a chave, "0/vazio honesto" direto — nunca mais o mock
// (decisão do usuário, 2026-08-25).
const SST_ATIVO = Boolean(process.env.SST_API_KEY);

export const tvController = {
  async obterDados() {
    if (!SST_ATIVO) return tvDadosVazios();
    return tvSstService.obterDados();
  },
};
