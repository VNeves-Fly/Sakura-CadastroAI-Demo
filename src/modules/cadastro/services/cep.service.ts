export interface ViaCepRawResponse {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

// Única camada autorizada a se comunicar com a API externa (ViaCEP).
// Diferente do QSA/Receita Federal (mockados por falta de acesso à API
// oficial paga), o ViaCEP é uma API pública gratuita — integração real.
// Só transporte HTTP: a tradução do formato de resposta é responsabilidade
// do cepAdapter, não deste service.
export const cepService = {
  async buscar(cepLimpo: string): Promise<ViaCepRawResponse | null> {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

    if (!response.ok) {
      return null;
    }

    return response.json();
  },
};
