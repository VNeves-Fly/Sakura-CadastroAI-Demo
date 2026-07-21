import type { validarCpfComMensagem } from "@/modules/cadastro/utils/cpf.util";
import type { validarDataNascimentoComMensagem } from "@/modules/cadastro/utils/data-nascimento.util";

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
  dataNascimento: string; // ISO (YYYY-MM-DD), de <input type="date">
  estadoCivil: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  rg: string;
  rgOrgaoEmissor: string;
  rgUf: string;
  rgArquivo: File | null;
  isRepresentante: boolean;
  procuracaoArquivo: File | null;
}

// Valores brutos que a IA extraiu do RG/CNH e do contrato social desse
// sócio — guardados à parte do form pra comparar com o que o usuário
// digitou (ver divergencia-ia.util.ts) sem virar fonte de verdade do
// formulário. Nunca sobrescreve o que o usuário já preencheu; só serve
// pra sinalizar divergência.
export interface SocioWizardValoresExtraidosIa {
  nome: string | null;
  cpf: string | null;
  dataNascimento: string | null;
  rg: string | null;
  rgOrgaoEmissor: string | null;
  rgUf: string | null;
  endereco: {
    logradouro: string | null;
    numero: string | null;
    bairro: string | null;
    cidade: string | null;
    uf: string | null;
    cep: string | null;
  } | null;
}

// Resultado de validação de um sócio — calculado no ViewModel (única
// fonte de verdade), consumido pelo SocioWizardCard só pra exibir.
export interface SocioWizardValidacao {
  cpfStatus: ReturnType<typeof validarCpfComMensagem>;
  dataNascimentoStatus: ReturnType<typeof validarDataNascimentoComMensagem>;
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
    dataNascimento: "",
    estadoCivil: "",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    rg: "",
    rgOrgaoEmissor: "",
    rgUf: "",
    rgArquivo: null,
    isRepresentante: false,
    procuracaoArquivo: null,
  };
}
