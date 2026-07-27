import type { CidadeComercial } from "@/modules/atribuicoes/domain/entities/cidade-comercial.entity";
import type {
  SubstituicaoHistorico,
  TipoAtribuicao,
} from "@/modules/atribuicoes/types/atribuicao.types";

export interface CidadeComercialRepository {
  // Recorte completo (planilha "MAPA COMERCIAL GESTORES") — filtro e
  // agregação rodam em memória sobre esse array, ver agregacoes.util.ts.
  findAll(): Promise<CidadeComercial[]>;
  // Reatribui todas as cidades de `nomeAntigo` pra `nomeNovo` (fundir ou
  // renomear um executivo, gestor ou base) e registra a mudança no
  // histórico — retorna o total de cidades afetadas.
  substituir(tipo: TipoAtribuicao, nomeAntigo: string, nomeNovo: string): Promise<number>;
  listarHistorico(): Promise<SubstituicaoHistorico[]>;
}
