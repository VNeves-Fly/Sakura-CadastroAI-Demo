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
  basesTexto: string;
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
  bases: string[];
  criarAcesso: boolean;
  password?: string;
  mustChangePassword: boolean;
  useTemporaryPassword: boolean;
}

export interface CreatedPromotorResult {
  promotor: PromotorCrudView;
  temporaryPassword?: string;
}
