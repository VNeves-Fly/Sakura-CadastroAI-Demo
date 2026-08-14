// Serviço externo SST (sst.flysakura.com — Sica/Sigot/TravelLink). Nomeado
// pelo serviço (não pela operação) porque pode ganhar outros métodos no
// futuro (Sigot, TravelLink) — hoje só expõe a checagem de SICA, nos dois
// jeitos que o SST permite buscar a mesma empresa.
export type SicaEmpresaStatus = "ativo" | "inativo";

export interface SicaEmpresaRegistro {
  codigoEmpresa: number;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  empresaStatus: SicaEmpresaStatus;
  codigoExecutivo: number;
  nomeExecutivo: string;
}

export interface SicaConsultaResultado {
  encontrado: boolean;
  registro: SicaEmpresaRegistro | null;
}

export interface SstStatusConexao {
  status: string;
  databases: Record<string, string>;
}

export interface SstService {
  // Checagem automática ao finalizar o cadastro — ver AnalisarCadastroUseCase.
  consultarSicaCNPJ(cnpj: string): Promise<SicaConsultaResultado>;
  // Confirmação do código digitado manualmente pelo analista — ver
  // SalvarSicaUseCase (cruza o CNPJ retornado contra o da agência).
  consultarSicaCodigoEmpresa(codigoEmpresa: number): Promise<SicaConsultaResultado>;
  // "Testar conexão" — GET /health, só pra confirmar que o SST está no ar
  // (ver TestarConexaoSstUseCase, mesmo padrão de WhatsAppMessagingService).
  verificarConexao(): Promise<SstStatusConexao>;
}
