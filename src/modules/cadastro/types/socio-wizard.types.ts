import type { validarCpfComMensagem } from "@/modules/cadastro/utils/cpf.util";

export const ESTADO_CIVIL_OPCOES = [
  { valor: "solteiro", label: "Solteiro(a)" },
  { valor: "casado", label: "Casado(a)" },
  { valor: "divorciado", label: "Divorciado(a)" },
  { valor: "viuvo", label: "Viúvo(a)" },
  { valor: "uniao_estavel", label: "União Estável" },
];

// Sócio e representante pedem os mesmos campos — o representante é só
// um sócio (ou uma pessoa adicionada manualmente) marcado com a flag
// isRepresentante, que libera o slot extra de Procuração.
export interface SocioWizardFormValues {
  nome: string;
  telefone: string;
  telefonePais: string;
  email: string;
  cpf: string;
  estadoCivil: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  rgArquivo: File | null;
  isRepresentante: boolean;
  procuracaoArquivo: File | null;
}

// Resultado de validação de um sócio — calculado no ViewModel (única
// fonte de verdade), consumido pelo SocioWizardCard só pra exibir.
export interface SocioWizardValidacao {
  cpfStatus: ReturnType<typeof validarCpfComMensagem>;
  emailInvalido: boolean;
  telefoneInvalido: boolean;
  rgErro: string | null;
  procuracaoErro: string | null;
}

export function criarSocioWizardVazio(nome = ""): SocioWizardFormValues {
  return {
    nome,
    telefone: "",
    telefonePais: "BR",
    email: "",
    cpf: "",
    estadoCivil: "",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    rgArquivo: null,
    isRepresentante: false,
    procuracaoArquivo: null,
  };
}
