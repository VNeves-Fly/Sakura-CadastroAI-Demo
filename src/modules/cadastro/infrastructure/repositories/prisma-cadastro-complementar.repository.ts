import type {
  PrismaClient,
  CadastroComplementar as CadastroComplementarRecord,
} from "@prisma/client";
import { CadastroComplementar } from "@/modules/cadastro/domain/entities/cadastro-complementar.entity";
import type {
  CadastroComplementarRepository,
  CreateCadastroComplementarData,
  UpdateCadastroComplementarData,
} from "@/modules/cadastro/domain/repositories/cadastro-complementar-repository";

export class PrismaCadastroComplementarRepository implements CadastroComplementarRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAgenciaId(agenciaId: string): Promise<CadastroComplementar | null> {
    const record = await this.prisma.cadastroComplementar.findUnique({
      where: { agenciaId },
    });
    return record ? this.toDomain(record) : null;
  }

  async create(data: CreateCadastroComplementarData): Promise<CadastroComplementar> {
    const record = await this.prisma.cadastroComplementar.create({ data });
    return this.toDomain(record);
  }

  async update(
    agenciaId: string,
    data: UpdateCadastroComplementarData,
  ): Promise<CadastroComplementar> {
    const record = await this.prisma.cadastroComplementar.update({
      where: { agenciaId },
      data,
    });
    return this.toDomain(record);
  }

  private toDomain(record: CadastroComplementarRecord): CadastroComplementar {
    return CadastroComplementar.create({
      id: record.id,
      agenciaId: record.agenciaId,
      telefoneComercial: record.telefoneComercial,
      emailOperacional: record.emailOperacional,
      emailComercial: record.emailComercial,
      emailFinanceiro: record.emailFinanceiro,
      cadasturNumero: record.cadasturNumero,
      cadasturDataCadastro: record.cadasturDataCadastro,
      cadasturValidade: record.cadasturValidade,
      cadasturSituacao: record.cadasturSituacao,
      resideBrasil: record.resideBrasil,
      tipoAgencia: record.tipoAgencia,
      enderecoAgenciaMesmoTitular: record.enderecoAgenciaMesmoTitular,
      socioVinculadoEnderecoId: record.socioVinculadoEnderecoId,
      bancoPais: record.bancoPais,
      bancoNome: record.bancoNome,
      bancoAgencia: record.bancoAgencia,
      bancoConta: record.bancoConta,
      bancoSwift: record.bancoSwift,
      tipoConta: record.tipoConta,
      favorecidoEhEmpresa: record.favorecidoEhEmpresa,
      favorecidoNome: record.favorecidoNome,
      favorecidoDoc: record.favorecidoDoc,
      chavePix: record.chavePix,
      tipoChavePix: record.tipoChavePix,
      tipoFaturamento: record.tipoFaturamento,
      percCorporativo: record.percCorporativo?.toNumber() ?? null,
      percConvencional: record.percConvencional?.toNumber() ?? null,
      submetidoAt: record.submetidoAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
