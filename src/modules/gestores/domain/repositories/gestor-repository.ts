import type { Gestor } from "@/modules/gestores/domain/entities/gestor.entity";

// Dados pro login opcional (Cargo.GESTOR) criado junto do Gestor — null =
// Gestor só de negócio, sem "Criar acesso na plataforma" marcado.
export interface NovoUsuarioGestorData {
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  mustChangePassword: boolean;
}

export interface CriarGestorData {
  nome: string;
  email: string | null;
  telefone: string | null;
  bases: string[];
  novoUsuario: NovoUsuarioGestorData | null;
}

export interface AtualizarGestorData {
  nome: string;
  email: string | null;
  telefone: string | null;
  bases: string[];
  // Só usado se o Gestor ainda não tiver userId — concede acesso na edição
  // (mesmo fluxo do checkbox na criação).
  novoUsuario: NovoUsuarioGestorData | null;
}

export interface GestorRepository {
  findAll(): Promise<Gestor[]>;
  findById(id: string): Promise<Gestor | null>;
  findByUserId(userId: string): Promise<Gestor | null>;
  findByEmail(email: string): Promise<Gestor | null>;
  criar(data: CriarGestorData): Promise<Gestor>;
  atualizar(id: string, data: AtualizarGestorData): Promise<Gestor>;
}
