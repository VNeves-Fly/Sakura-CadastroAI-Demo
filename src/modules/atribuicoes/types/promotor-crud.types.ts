export interface PromotorCrudView {
  id: string;
  nome: string;
  sica: number | null;
  email: string;
  telefone: string | null;
  gestorId: string | null;
  bases: string[];
  temAcesso: boolean;
}

export interface PromotorFormValues {
  nome: string;
  sica: string;
  email: string;
  telefone: string;
  gestorId: string;
  baseIds: string[];
  criarAcesso: boolean;
  password: string;
  mustChangePassword: boolean;
  useTemporaryPassword: boolean;
}

export interface PromotorPayload {
  nome: string;
  sica: number | null;
  email: string;
  telefone: string | null;
  gestorId: string;
  baseIds: string[];
  criarAcesso: boolean;
  password?: string;
  mustChangePassword: boolean;
  useTemporaryPassword: boolean;
}

// Opção do select de Gestor (Admin/Diretor) — inclui as siglas de base do
// Gestor pra restringir o multi-select de bases do Executivo a esse
// subconjunto (controle só no frontend, ver PromotorForm).
export interface GestorOpcao {
  id: string;
  nome: string;
  bases: string[];
}

export interface CreatedPromotorResult {
  promotor: PromotorCrudView;
  temporaryPassword?: string;
}
