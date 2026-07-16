import type { RawQsaResponse } from "@/modules/cadastro/services/agencia.service";
import type { QsaResultView } from "@/modules/cadastro/types/agencia.types";

// Traduz dados entre a forma que a View/ViewModel usam e a forma que o
// Service/API externa esperam — nenhuma outra camada do front conhece o
// shape bruto da API.
//
// O envio final (Agencia + CadastroComplementar, criados juntos e
// atômicos) será implementado na seção Revisão, com o payload completo
// dos 4 seções — por isso não há aqui ainda um toSubmitFormData.
export const agenciaAdapter = {
  toQsaResultView(raw: RawQsaResponse): QsaResultView {
    return {
      razaoSocial: raw.razaoSocial,
      cnaeCompativel: raw.cnaeCompativel,
      nomesSocios: raw.socios.map((socio) => socio.nome),
      dataAbertura: raw.dataAbertura,
      telefoneReceita: raw.telefoneReceita,
      emailReceita: raw.emailReceita,
    };
  },
};
