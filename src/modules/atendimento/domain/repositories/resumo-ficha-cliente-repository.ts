import type { ResumoFichaClienteEntity } from "@/modules/atendimento/domain/entities/conversa.entity";

// Leitura read-only cruzando dados já existentes do módulo cadastro
// (Documento/DadosReceita/Contrato/Agencia) — sem tabela própria.
export interface ResumoFichaClienteRepository {
  obterResumo(agenciaId: string): Promise<ResumoFichaClienteEntity>;
}

// Placeholder pra conversas "não identificado" — sem agência vinculada,
// não há ficha nenhuma pra resumir.
export const RESUMO_FICHA_NAO_IDENTIFICADO: ResumoFichaClienteEntity = {
  statusAgencia: "em_andamento",
  documentosAprovados: 0,
  documentosPendentes: 0,
  situacaoCadastralReceita: null,
  contratoStatus: null,
  amatSofiaConsultado: false,
};
