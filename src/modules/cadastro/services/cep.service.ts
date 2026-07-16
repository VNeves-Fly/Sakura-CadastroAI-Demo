export interface EnderecoViaCep {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

interface ViaCepRawResponse {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

// Única camada autorizada a se comunicar com a API externa (ViaCEP).
// Diferente do QSA/Receita Federal (mockados por falta de acesso à API
// oficial paga), o ViaCEP é uma API pública gratuita — integração real.
export const cepService = {
  async buscar(cepLimpo: string): Promise<EnderecoViaCep | null> {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

    if (!response.ok) {
      return null;
    }

    const data: ViaCepRawResponse = await response.json();

    if (data.erro) {
      return null;
    }

    return {
      logradouro: data.logradouro ?? "",
      bairro: data.bairro ?? "",
      cidade: data.localidade ?? "",
      uf: data.uf ?? "",
    };
  },
};
