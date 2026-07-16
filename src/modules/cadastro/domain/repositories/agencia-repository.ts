import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";

export interface CreateAgenciaData {
  razaoSocial: string;
  cnpj: string;
  contratoSocialPath: string;
  emailContato: string;
  telefoneContato: string;
  origem: string | null;
  // Gravado atomicamente junto (CadastroComplementar), numa única
  // escrita aninhada do Prisma — não existe intervalo entre os dois.
  dadosComplementares: unknown;
}

export interface AgenciaRepository {
  findByCnpj(cnpj: string): Promise<Agencia | null>;
  create(data: CreateAgenciaData): Promise<Agencia>;
}
