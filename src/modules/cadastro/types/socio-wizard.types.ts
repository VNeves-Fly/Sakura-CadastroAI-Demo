import type { validarCpfComMensagem } from "@/modules/cadastro/utils/cpf.util";
import type { validarDataNascimentoComMensagem } from "@/modules/cadastro/utils/data-nascimento.util";
import type { EstadoCivil } from "@/modules/cadastro/domain/enums";

// Catálogo completo do enum EstadoCivil (ver domain/enums.ts) — precisa
// cobrir os 7 valores que o agente de análise de documentos pode
// devolver, senão o Select não consegue exibir/selecionar um sócio
// separado ou desquitado extraído do contrato social.
export const ESTADO_CIVIL_OPCOES: Array<{ valor: EstadoCivil; label: string }> = [
  { valor: "solteiro", label: "Solteiro(a)" },
  { valor: "casado", label: "Casado(a)" },
  { valor: "separado", label: "Separado(a)" },
  { valor: "divorciado", label: "Divorciado(a)" },
  { valor: "viuvo", label: "Viúvo(a)" },
  { valor: "uniao_estavel", label: "União Estável" },
  { valor: "desquitado", label: "Desquitado(a)" },
];

// Mapa valor → rótulo, pro `items` do Select — sem ele, `<Select.Value>`
// mostra o valor bruto (ex: "uniao_estavel") em vez do rótulo formatado.
export const ESTADO_CIVIL_OPCOES_ITEMS: Record<string, string> = Object.fromEntries(
  ESTADO_CIVIL_OPCOES.map((opcao) => [opcao.valor, opcao.label]),
);

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
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  rg: string;
  rgOrgaoEmissor: string;
  rgUf: string;
  rgArquivo: File | null;
  nacionalidade: string;
  // Extraído pela IA do contrato social (não editável no wizard — só o
  // analista corrige depois, no painel) — decide se o sócio assina o
  // contrato (ver formatarClausulaSocio/filtro de signatarios).
  administrativo: boolean | null;
  isRepresentante: boolean;
  procuracaoArquivo: File | null;
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
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    rg: "",
    rgOrgaoEmissor: "",
    rgUf: "",
    rgArquivo: null,
    nacionalidade: "Brasileiro(a)",
    administrativo: null,
    isRepresentante: false,
    procuracaoArquivo: null,
  };
}
