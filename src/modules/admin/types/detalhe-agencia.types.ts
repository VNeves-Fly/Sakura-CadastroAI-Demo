import type { EnderecoInput } from "@/modules/cadastro/application/dto/finalizar-cadastro.dto";

// Espelha exatamente o que é persistido em
// CadastroComplementar.dadosPorPasso pelo FinalizarCadastroUseCase — só
// os campos que o wizard público realmente coleta (nenhum campo
// inventado que não exista no formulário do cliente).
export interface DadosComplementaresSocio {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  estadoCivil: string;
  endereco: EnderecoInput;
  isRepresentante: boolean;
  rgPath: string;
  procuracaoPath: string | null;
}

export interface DadosComplementaresEmpresa {
  telefoneComercial: string;
  emailOperacional: string;
  emailComercial: string;
  emailFinanceiro: string;
}

export interface DadosComplementaresEnderecoBanco {
  enderecoMesmoSocio: boolean;
  socioEnderecoVinculado: number | null;
  endereco: EnderecoInput;
  bancoPais: string;
  bancoNome: string;
  bancoAgencia: string;
  bancoConta: string;
  bancoSwift: string;
  tipoConta: string;
  favorecidoEhEmpresa: boolean;
  favorecidoNome: string;
  favorecidoDoc: string;
}

export interface DadosComplementares {
  empresa: DadosComplementaresEmpresa;
  socios: DadosComplementaresSocio[];
  enderecoBanco: DadosComplementaresEnderecoBanco;
}

export function parseDadosComplementares(valor: unknown): DadosComplementares | null {
  if (!valor || typeof valor !== "object") return null;
  return valor as DadosComplementares;
}
