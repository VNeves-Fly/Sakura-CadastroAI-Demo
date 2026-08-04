import type { Promotor } from "@/modules/atribuicoes/domain/entities/promotor.entity";

// Dados pro login opcional (Cargo.EXECUTIVO) criado junto do Promotor —
// null = Promotor só de negócio, sem "Criar acesso na plataforma" marcado.
export interface NovoUsuarioPromotorData {
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  mustChangePassword: boolean;
}

export interface CriarPromotorData {
  nome: string;
  sica: number | null;
  email: string;
  telefone: string | null;
  gestorId: string;
  bases: string[];
  novoUsuario: NovoUsuarioPromotorData | null;
}

export interface AtualizarPromotorData {
  nome: string;
  sica: number | null;
  email: string;
  telefone: string | null;
  gestorId: string;
  bases: string[];
  // Só usado se o Promotor ainda não tiver userId — concede acesso na
  // edição (mesmo fluxo do checkbox na criação).
  novoUsuario: NovoUsuarioPromotorData | null;
}

export interface PromotorRepository {
  // Fonte real (planilha "Links Promotores.xlsx") de quem é cada
  // executivo/gestor comercial — todo registro tem `sica`, sem exceção.
  findAll(): Promise<Promotor[]>;
  findById(id: string): Promise<Promotor | null>;
  // Resolve o promotor dono de um link pessoal (parâmetro `?executivo=`
  // do cadastro público) — usado na atribuição automática de agência.
  findByLinkExecutivoId(uuid: string): Promise<Promotor | null>;
  // Busca por e-mail (campo único) — usado na página pública onde o
  // executivo recupera o próprio link de cadastro.
  findByEmail(email: string): Promise<Promotor | null>;
  findByUserId(userId: string): Promise<Promotor | null>;
  criar(data: CriarPromotorData): Promise<Promotor>;
  atualizar(id: string, data: AtualizarPromotorData): Promise<Promotor>;
}
