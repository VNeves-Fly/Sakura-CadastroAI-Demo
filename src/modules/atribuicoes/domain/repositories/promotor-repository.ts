import type { Promotor } from "@/modules/atribuicoes/domain/entities/promotor.entity";

export interface PromotorRepository {
  // Fonte real (planilha "Links Promotores.xlsx") de quem é cada
  // executivo/gestor comercial — todo registro tem `sica`, sem exceção.
  findAll(): Promise<Promotor[]>;
  // Resolve o promotor dono de um link pessoal (parâmetro `?executivo=`
  // do cadastro público) — usado na atribuição automática de agência.
  findByLinkExecutivoId(uuid: string): Promise<Promotor | null>;
  // Busca por e-mail (campo único) — usado na página pública onde o
  // executivo recupera o próprio link de cadastro.
  findByEmail(email: string): Promise<Promotor | null>;
}
