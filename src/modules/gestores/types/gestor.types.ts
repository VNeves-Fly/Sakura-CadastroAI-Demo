import type { GestorNivel } from "@/modules/gestores/types/gestor-nivel.types";

export interface GestorView {
  id: string;
  nome: string;
  sica: number | null;
  email: string | null;
  telefone: string | null;
  temAcesso: boolean;
  bases: string[];
  createdAt: string;
}

export interface GestorFormValues {
  nome: string;
  sica: string;
  email: string;
  telefone: string;
  baseIds: string[];
  // Mock front-end (ver gestor-nivel.types.ts) — não vai no payload real da
  // API, só é persistido em gestor-niveis.store.ts após o submit.
  nivel: GestorNivel | null;
  criarAcesso: boolean;
  password: string;
  mustChangePassword: boolean;
  useTemporaryPassword: boolean;
}

export interface GestorPayload {
  nome: string;
  sica: number | null;
  email: string | null;
  telefone: string | null;
  baseIds: string[];
  criarAcesso: boolean;
  password?: string;
  mustChangePassword: boolean;
  useTemporaryPassword: boolean;
}

export interface CreatedGestorResult {
  gestor: GestorView;
  temporaryPassword?: string;
}
