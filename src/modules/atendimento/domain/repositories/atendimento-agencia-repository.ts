export interface RegistroAtendimentoAgenciaAtual {
  id: string;
  analistaId: string;
  analistaNome: string;
  assumidoEm: Date;
}

export interface RegistroHistoricoAtendimentoAgencia {
  analistaNome: string;
  assumidoEm: Date;
  liberadoEm: Date | null;
}

// Mesma forma de RegistroAtendimentoAtivoPorAgencia/RegistroAtendimentoEncerradoPorAgencia
// (assumir-atendimento-repository.ts), só que já 1:1 por agência — sem
// conversaId, já que aqui não existe join com Conversa nenhum.
export interface RegistroAtendimentoAgenciaAtivo {
  agenciaId: string;
  analistaId: string;
  analistaNome: string;
  assumidoEm: Date;
}

export interface RegistroAtendimentoAgenciaEncerrado {
  agenciaId: string;
  analistaNome: string;
  assumidoEm: Date;
  liberadoEm: Date;
}

export interface AtendimentoAgenciaRepository {
  findAtual(agenciaId: string): Promise<RegistroAtendimentoAgenciaAtual | null>;
  criar(agenciaId: string, analistaId: string): Promise<void>;
  liberar(registroId: string): Promise<void>;
  listarHistorico(
    agenciaId: string,
    limite?: number,
  ): Promise<RegistroHistoricoAtendimentoAgencia[]>;
  listarAtivosPorAgencias(agenciaIds: string[]): Promise<RegistroAtendimentoAgenciaAtivo[]>;
  listarUltimoEncerradoPorAgencias(
    agenciaIds: string[],
  ): Promise<RegistroAtendimentoAgenciaEncerrado[]>;
}
