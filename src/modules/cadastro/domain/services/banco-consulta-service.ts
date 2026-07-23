export interface Banco {
  codigo: string;
  nome: string;
  nomeCompleto: string;
}

export interface BancoConsultaService {
  listar(): Promise<Banco[]>;
}
