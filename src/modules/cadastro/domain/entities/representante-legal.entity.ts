import type { PapelRepresentante } from "@/modules/cadastro/domain/enums";

export interface RepresentanteLegalProps {
  id: string;
  agenciaId: string;

  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  cnpj: string | null;
  isPj: boolean;
  rg: string | null;
  rgOrgaoEmissor: string | null;
  dataNascimento: Date | null;
  estadoCivil: string;
  regimeBens: string | null;
  nacionalidade: string | null;
  cargo: string | null;
  papel: PapelRepresentante;
  isRepresentanteLegal: boolean;
  administrativo: boolean | null;
  ativo: boolean;
  origem: string | null;
  preenchidoPorIa: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export class RepresentanteLegal {
  private constructor(private readonly props: RepresentanteLegalProps) {}

  static create(props: RepresentanteLegalProps): RepresentanteLegal {
    return new RepresentanteLegal(props);
  }

  get id(): string {
    return this.props.id;
  }

  get agenciaId(): string {
    return this.props.agenciaId;
  }

  get nome(): string {
    return this.props.nome;
  }

  get email(): string {
    return this.props.email;
  }

  get telefone(): string {
    return this.props.telefone;
  }

  get cpf(): string {
    return this.props.cpf;
  }

  get cnpj(): string | null {
    return this.props.cnpj;
  }

  get isPj(): boolean {
    return this.props.isPj;
  }

  get rg(): string | null {
    return this.props.rg;
  }

  get rgOrgaoEmissor(): string | null {
    return this.props.rgOrgaoEmissor;
  }

  get dataNascimento(): Date | null {
    return this.props.dataNascimento;
  }

  get estadoCivil(): string {
    return this.props.estadoCivil;
  }

  get regimeBens(): string | null {
    return this.props.regimeBens;
  }

  get nacionalidade(): string | null {
    return this.props.nacionalidade;
  }

  get cargo(): string | null {
    return this.props.cargo;
  }

  get papel(): PapelRepresentante {
    return this.props.papel;
  }

  get isRepresentanteLegal(): boolean {
    return this.props.isRepresentanteLegal;
  }

  get administrativo(): boolean | null {
    return this.props.administrativo;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get origem(): string | null {
    return this.props.origem;
  }

  get preenchidoPorIa(): boolean {
    return this.props.preenchidoPorIa;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): Omit<RepresentanteLegalProps, "dataNascimento" | "createdAt" | "updatedAt"> & {
    dataNascimento: string | null;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      ...this.props,
      dataNascimento: this.props.dataNascimento?.toISOString() ?? null,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
