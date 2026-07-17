import { unmaskCep } from "@/modules/cadastro/utils/cep.util";
import type { ViaCepRawResponse } from "@/modules/cadastro/services/cep.service";

export interface EnderecoViaCep {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

// Traduz dados entre a forma que a View/ViewModel usam e a forma que o
// Service/API externa (ViaCEP) espera/retorna — nenhuma outra camada do
// front conhece o shape bruto da API.
export const cepAdapter = {
  toBuscaCepInput(cepMascarado: string): string {
    return unmaskCep(cepMascarado);
  },

  toEnderecoView(raw: ViaCepRawResponse | null): EnderecoViaCep | null {
    if (!raw || raw.erro) {
      return null;
    }

    return {
      logradouro: raw.logradouro ?? "",
      bairro: raw.bairro ?? "",
      cidade: raw.localidade ?? "",
      uf: raw.uf ?? "",
    };
  },
};
