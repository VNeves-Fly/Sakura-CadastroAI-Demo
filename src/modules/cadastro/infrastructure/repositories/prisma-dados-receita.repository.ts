import type {
  PrismaClient,
  DadosReceita as DadosReceitaRecord,
  Endereco as EnderecoRecord,
  Cnae as CnaeRecord,
} from "@prisma/client";
import { DadosReceita } from "@/modules/cadastro/domain/entities/dados-receita.entity";
import type {
  CreateDadosReceitaData,
  DadosReceitaRepository,
  UpdateDadosReceitaData,
} from "@/modules/cadastro/domain/repositories/dados-receita-repository";

type DadosReceitaComRelacoes = DadosReceitaRecord & {
  endereco: EnderecoRecord | null;
  cnaes: CnaeRecord[];
};

export class PrismaDadosReceitaRepository implements DadosReceitaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAgenciaId(agenciaId: string): Promise<DadosReceita | null> {
    const record = await this.prisma.dadosReceita.findUnique({
      where: { agenciaId },
      include: { endereco: true, cnaes: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async create(data: CreateDadosReceitaData): Promise<DadosReceita> {
    const { endereco, cnaes, ...escalar } = data;

    const record = await this.prisma.dadosReceita.create({
      data: {
        ...escalar,
        endereco: endereco ? { create: endereco } : undefined,
        cnaes: cnaes?.length ? { create: cnaes } : undefined,
      },
      include: { endereco: true, cnaes: true },
    });
    return this.toDomain(record);
  }

  // Endereço/CNAEs não entram no update ainda — essa entrega só cobre a
  // gravação inicial (create); refresh/reconsulta é escopo futuro.
  async update(agenciaId: string, data: UpdateDadosReceitaData): Promise<DadosReceita> {
    const escalar: Omit<UpdateDadosReceitaData, "endereco" | "cnaes"> = {
      situacaoCadastral: data.situacaoCadastral,
      dataAbertura: data.dataAbertura,
      naturezaJuridica: data.naturezaJuridica,
      porte: data.porte,
      capitalSocial: data.capitalSocial,
      telefone: data.telefone,
      email: data.email,
      optanteSimples: data.optanteSimples,
      dataOpcaoSimples: data.dataOpcaoSimples,
    };

    const record = await this.prisma.dadosReceita.update({
      where: { agenciaId },
      data: escalar,
      include: { endereco: true, cnaes: true },
    });
    return this.toDomain(record);
  }

  private toDomain(record: DadosReceitaComRelacoes): DadosReceita {
    return DadosReceita.create({
      id: record.id,
      agenciaId: record.agenciaId,
      situacaoCadastral: record.situacaoCadastral,
      dataAbertura: record.dataAbertura,
      naturezaJuridica: record.naturezaJuridica,
      porte: record.porte,
      capitalSocial: record.capitalSocial?.toNumber() ?? null,
      telefone: record.telefone,
      email: record.email,
      optanteSimples: record.optanteSimples,
      dataOpcaoSimples: record.dataOpcaoSimples,
      endereco: record.endereco
        ? {
            cep: record.endereco.cep,
            logradouro: record.endereco.logradouro,
            numero: record.endereco.numero,
            complemento: record.endereco.complemento,
            bairro: record.endereco.bairro,
            cidade: record.endereco.cidade,
            uf: record.endereco.uf,
          }
        : null,
      cnaes: record.cnaes.map((cnae) => ({
        codigo: cnae.codigo,
        descricao: cnae.descricao,
        principal: cnae.principal,
      })),
      consultadoEm: record.consultadoEm,
    });
  }
}
