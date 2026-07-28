// Consulta direta ao SOFIA (reputação/restrições), usada só pela reconsulta
// manual isolada do dossiê (ver ReconsultarCreditoUseCase/ConsultaSofiaCard).
// Diferente do stage2.sofia que hoje vem embutido em
// AnaliseIaService.avaliar() — a chamada combinada do agente
// (/agency-analysis/sync), que decide sozinho quando consultar SOFIA junto
// com AMAT/processos — este serviço bate direto no endpoint do provedor
// (GET /api/v1/sofia/) por CNPJ, sem disparar o pipeline de análise
// inteiro de novo.
export interface SofiaRegistro {
  // Schema real do provedor (ver exemplo em FlysakuraSofiaConsultaAdapter),
  // mas mantido como dict livre porque não há contrato publicado — mesma
  // cautela já aplicada a AnaliseIaStage2.sofia/processosJudiciais/
  // reclamacoes (ver analise-ia-service.ts).
  [chave: string]: unknown;
}

export interface SofiaConsultaResultado {
  total: number;
  records: SofiaRegistro[];
}

export interface SofiaConsultaService {
  consultarPorCnpj(cnpj: string): Promise<SofiaConsultaResultado>;
}
