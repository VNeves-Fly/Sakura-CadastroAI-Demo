export interface AgenciaProps {
  id: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  etapaAtual: number;
  status: string;
  contratoSocialPath: string;
  emailContato: string;
  telefoneContato: string;
  origem: string | null;
  createdAt: Date;
  updatedAt: Date;
  sicaCodigo: string | null;
  sicaSalvoPor: string | null;
  sicaSalvoEm: Date | null;
  travelLinkCriado: boolean;
  travelLinkSalvoPor: string | null;
  travelLinkSalvoEm: Date | null;
  // Id real do Promotor atribuído (null = nenhum executivo atribuído) —
  // usado pro escopo de leitura de Gestor/Executivo em /cadastros
  // (2026-08-03), não só pra exibir o nome (ver executivoNome em
  // ListarCadastrosItem/AgenciaDetalhe).
  executivoId: string | null;
  // Ver comentário no schema.prisma — null = nunca visto por quem estava
  // em atendimento.
  atualizacaoVistaEm: Date | null;
  atualizacaoVistaPor: string | null;
  // Ver comentário no schema.prisma — "estou esperando algo da agência".
  infoPendente: boolean;
  // Preenchidos só quando removido manualmente (ver comentário no
  // schema.prisma) — null enquanto infoPendente nunca foi desligado à
  // mão, ou depois que ligou de novo (marcarInfoPendente zera os dois).
  infoPendenteRemovidoPor: string | null;
  infoPendenteRemovidoEm: Date | null;
  // Fluxo paralelo de biometria facial (Legitimuz) antes da assinatura
  // D4Sign — ver docs/legitimuz/. false preserva o fluxo atual.
  gateBiometriaAtivo: boolean;
}

export class Agencia {
  private constructor(private readonly props: AgenciaProps) {}

  static create(props: AgenciaProps): Agencia {
    return new Agencia(props);
  }

  get id(): string {
    return this.props.id;
  }

  get razaoSocial(): string {
    return this.props.razaoSocial;
  }

  get nomeFantasia(): string | null {
    return this.props.nomeFantasia;
  }

  get cnpj(): string {
    return this.props.cnpj;
  }

  get etapaAtual(): number {
    return this.props.etapaAtual;
  }

  get status(): string {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get contratoSocialPath(): string {
    return this.props.contratoSocialPath;
  }

  get emailContato(): string {
    return this.props.emailContato;
  }

  get telefoneContato(): string {
    return this.props.telefoneContato;
  }

  get origem(): string | null {
    return this.props.origem;
  }

  get sicaCodigo(): string | null {
    return this.props.sicaCodigo;
  }

  get sicaSalvoPor(): string | null {
    return this.props.sicaSalvoPor;
  }

  get sicaSalvoEm(): Date | null {
    return this.props.sicaSalvoEm;
  }

  get travelLinkCriado(): boolean {
    return this.props.travelLinkCriado;
  }

  get travelLinkSalvoPor(): string | null {
    return this.props.travelLinkSalvoPor;
  }

  get travelLinkSalvoEm(): Date | null {
    return this.props.travelLinkSalvoEm;
  }

  get executivoId(): string | null {
    return this.props.executivoId;
  }

  get atualizacaoVistaEm(): Date | null {
    return this.props.atualizacaoVistaEm;
  }

  get atualizacaoVistaPor(): string | null {
    return this.props.atualizacaoVistaPor;
  }

  get infoPendente(): boolean {
    return this.props.infoPendente;
  }

  get infoPendenteRemovidoPor(): string | null {
    return this.props.infoPendenteRemovidoPor;
  }

  get infoPendenteRemovidoEm(): Date | null {
    return this.props.infoPendenteRemovidoEm;
  }

  get gateBiometriaAtivo(): boolean {
    return this.props.gateBiometriaAtivo;
  }

  toJSON(): Omit<
    AgenciaProps,
    | "createdAt"
    | "updatedAt"
    | "sicaSalvoEm"
    | "travelLinkSalvoEm"
    | "atualizacaoVistaEm"
    | "infoPendenteRemovidoEm"
  > & {
    createdAt: string;
    updatedAt: string;
    sicaSalvoEm: string | null;
    travelLinkSalvoEm: string | null;
    atualizacaoVistaEm: string | null;
    infoPendenteRemovidoEm: string | null;
  } {
    return {
      id: this.props.id,
      razaoSocial: this.props.razaoSocial,
      nomeFantasia: this.props.nomeFantasia,
      cnpj: this.props.cnpj,
      etapaAtual: this.props.etapaAtual,
      status: this.props.status,
      contratoSocialPath: this.props.contratoSocialPath,
      emailContato: this.props.emailContato,
      telefoneContato: this.props.telefoneContato,
      origem: this.props.origem,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      sicaCodigo: this.props.sicaCodigo,
      sicaSalvoPor: this.props.sicaSalvoPor,
      sicaSalvoEm: this.props.sicaSalvoEm?.toISOString() ?? null,
      travelLinkCriado: this.props.travelLinkCriado,
      travelLinkSalvoPor: this.props.travelLinkSalvoPor,
      travelLinkSalvoEm: this.props.travelLinkSalvoEm?.toISOString() ?? null,
      executivoId: this.props.executivoId,
      atualizacaoVistaEm: this.props.atualizacaoVistaEm?.toISOString() ?? null,
      atualizacaoVistaPor: this.props.atualizacaoVistaPor,
      infoPendente: this.props.infoPendente,
      infoPendenteRemovidoPor: this.props.infoPendenteRemovidoPor,
      infoPendenteRemovidoEm: this.props.infoPendenteRemovidoEm?.toISOString() ?? null,
      gateBiometriaAtivo: this.props.gateBiometriaAtivo,
    };
  }
}

// Único lugar que decide "tem atualização não vista" — dossiê (1 agência,
// via findByAgenciaId) e listagem (N agências, via listar()) chamam isto
// em vez de reimplementar a comparação de datas.
export function temAtualizacaoPendente(
  atualizacaoVistaEm: Date | null,
  ultimaNotificacaoEm: Date | null,
): boolean {
  if (!ultimaNotificacaoEm) return false;
  if (!atualizacaoVistaEm) return true;
  return ultimaNotificacaoEm > atualizacaoVistaEm;
}
