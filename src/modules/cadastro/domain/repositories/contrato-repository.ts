import type { Contrato } from "@/modules/cadastro/domain/entities/contrato.entity";
import type { OrigemGeracaoContrato, StatusContrato } from "@/modules/cadastro/domain/enums";

export interface CreateContratoData {
  agenciaId: string;
  provedorId: string;
  status?: StatusContrato;
  origemGeracao: OrigemGeracaoContrato;
  numContrato?: string | null;
  conteudoPreenchido?: string | null;
  contratoGcsPath?: string | null;
}

export interface ContratoRepository {
  findById(id: string): Promise<Contrato | null>;
  findByAgenciaId(agenciaId: string): Promise<Contrato[]>;
  create(data: CreateContratoData): Promise<Contrato>;
  atualizarStatus(id: string, status: StatusContrato): Promise<Contrato>;
  confirmarLeitura(id: string, confirmadoPor: string): Promise<Contrato>;
  registrarAssinatura(id: string, pdfAssinadoGcsPath: string): Promise<Contrato>;
  // Corrige o provedorId (uuid do documento no D4Sign) de um contrato já
  // existente — usado por RegistrarContratoExternoUseCase quando o
  // documento de verdade foi criado fora do fluxo automático (direto no
  // D4Sign, ou assinado fisicamente e depois subido lá). origemGeracao
  // vira "externo" junto, na mesma escrita.
  atualizarProvedorId(
    id: string,
    data: { provedorId: string; origemGeracao: OrigemGeracaoContrato },
  ): Promise<Contrato>;
}
