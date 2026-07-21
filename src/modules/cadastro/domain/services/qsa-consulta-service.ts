export interface QsaSocio {
  nome: string;
}

export interface QsaEndereco {
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
}

export interface QsaCnae {
  codigo: string | null;
  descricao: string | null;
  principal: boolean;
}

export interface QsaResult {
  cnpj: string;
  razaoSocial: string;
  cnaeCompativel: boolean;
  socios: QsaSocio[];
  dataAbertura: string;
  telefoneReceita: string;
  emailReceita: string;
  // Campos ampliados do payload da API comercial do ReceitaWS — usados só
  // pra persistir o "cache" de Dados da Receita no FinalizarCadastroUseCase
  // (ver DadosReceita no schema). Nomes de campo mapeados com base no
  // conhecimento público da API, não confirmados contra uma resposta real
  // neste projeto — por isso tudo aqui é opcional/nullable.
  situacaoCadastral: string | null;
  naturezaJuridica: string | null;
  porte: string | null;
  capitalSocial: number | null;
  optanteSimples: boolean;
  dataOpcaoSimples: string | null;
  endereco: QsaEndereco | null;
  cnaes: QsaCnae[];
}

export interface QsaConsultaService {
  consultar(cnpj: string): Promise<QsaResult | null>;
}
