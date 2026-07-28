export interface RawAgenciaResponse {
  id: string;
  cnpj: string;
  razaoSocial: string;
  // Sempre "em_analise" — a IA roda depois, em background (ver
  // AnalisarCadastroUseCase). O desfecho final não é conhecido aqui.
  status: string;
}

export type CriarAgenciaResult =
  { ok: true; data: RawAgenciaResponse } | { ok: false; duplicado: boolean; error: string };

export interface RawEnderecoContratoSocial {
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
}

export interface RawSocioContratoSocial {
  nome: string;
  cpf: string | null;
  dataNascimento: string | null;
  estadoCivil: string | null;
  nacionalidade: string | null;
  regimeBens: string | null;
  participacao: number | null;
  rg: string | null;
  rgExpedidor: string | null;
  rgExpedidoUf: string | null;
  endereco: RawEnderecoContratoSocial | null;
  administrativo: boolean | null;
  ativo: boolean | null;
}

export interface RawAnaliseContratoSocialResponse {
  cnpjConfere: boolean | null;
  socios: RawSocioContratoSocial[];
  alertas: string[];
  confianca: number;
  razaoSocialExtraida: string | null;
  capitalSocial: number | null;
  enderecoEmpresa: RawEnderecoContratoSocial | null;
  objetoSocial: string | null;
  dataConstituicao: string | null;
}

export interface RawAnaliseDocumentoIdentificacaoResponse {
  nome: string | null;
  cpf: string | null;
  dataNascimento: string | null;
  rg: string | null;
  rgOrgaoEmissor: string | null;
  rgUf: string | null;
  alertas: string[];
  confianca: number;
}

export interface RawBancoResponse {
  codigo: string;
  nome: string;
  nomeCompleto: string;
}

// Única camada autorizada a se comunicar com a API externa (rotas /api/cadastro).
export const agenciaService = {
  // Aviso antecipado no preenchimento (não substitui a checagem real do
  // submit final) — best-effort: falha aqui não deve travar o usuário.
  async verificarCnpjCadastrado(cnpj: string): Promise<boolean> {
    const response = await fetch("/api/cadastro/verificar-cnpj", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cnpj }),
    });

    if (!response.ok) {
      throw new Error("Não foi possível verificar o CNPJ.");
    }

    const data: { existe: boolean } = await response.json();
    return data.existe;
  },

  async analisarContratoSocial(formData: FormData): Promise<RawAnaliseContratoSocialResponse> {
    const response = await fetch("/api/cadastro/documentos/contrato-social", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Não foi possível analisar o contrato social.");
    }

    return response.json();
  },

  async listarBancos(): Promise<RawBancoResponse[]> {
    const response = await fetch("/api/cadastro/bancos");

    if (!response.ok) {
      throw new Error("Não foi possível carregar a lista de bancos.");
    }

    return response.json();
  },

  async analisarDocumentoIdentificacao(
    formData: FormData,
  ): Promise<RawAnaliseDocumentoIdentificacaoResponse> {
    const response = await fetch("/api/cadastro/documentos/identificacao", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Não foi possível analisar o RG ou CNH.");
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
