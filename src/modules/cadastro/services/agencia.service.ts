export interface RawAgenciaResponse {
  id: string;
  cnpj: string;
  razaoSocial: string;
  status: string;
}

export interface RawQsaResponse {
  cnpj: string;
  razaoSocial: string;
  cnaeCompativel: boolean;
  socios: Array<{ nome: string }>;
  dataAbertura: string;
  telefoneReceita: string;
  emailReceita: string;
}

export type CriarAgenciaResult =
  { ok: true; data: RawAgenciaResponse } | { ok: false; duplicado: boolean; error: string };

// Única camada autorizada a se comunicar com a API externa (rotas /api/cadastro).
export const agenciaService = {
  async consultarQsa(cnpj: string): Promise<RawQsaResponse | null> {
    const response = await fetch("/api/cadastro/qsa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cnpj }),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Não foi possível consultar o QSA na Receita Federal.");
    }

    return response.json();
  },

  async criarAgencia(formData: FormData): Promise<CriarAgenciaResult> {
    const response = await fetch("/api/cadastro/agencia", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      return {
        ok: false,
        duplicado: response.status === 409,
        error: payload?.error ?? "Não foi possível enviar o cadastro.",
      };
    }

    const data = await response.json();
    return { ok: true, data };
  },
};
