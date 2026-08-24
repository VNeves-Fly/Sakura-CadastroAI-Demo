import type { DisparoEmail } from "@/modules/shared/domain/enums";

export interface EmailLogProps {
  id: string;
  destinatario: string;
  assunto: string;
  corpo: string;
  origem: string;
  disparo: DisparoEmail;
  agenciaId: string | null;
  sucesso: boolean;
  erro: string | null;
  enviadoEm: Date;
}

export class EmailLog {
  private constructor(private readonly props: EmailLogProps) {}

  static create(props: EmailLogProps): EmailLog {
    return new EmailLog(props);
  }

  get id(): string {
    return this.props.id;
  }

  get destinatario(): string {
    return this.props.destinatario;
  }

  get assunto(): string {
    return this.props.assunto;
  }

  get corpo(): string {
    return this.props.corpo;
  }

  get origem(): string {
    return this.props.origem;
  }

  get disparo(): DisparoEmail {
    return this.props.disparo;
  }

  get agenciaId(): string | null {
    return this.props.agenciaId;
  }

  get sucesso(): boolean {
    return this.props.sucesso;
  }

  get erro(): string | null {
    return this.props.erro;
  }

  get enviadoEm(): Date {
    return this.props.enviadoEm;
  }

  toJSON(): Omit<EmailLogProps, "enviadoEm"> & { enviadoEm: string } {
    return { ...this.props, enviadoEm: this.props.enviadoEm.toISOString() };
  }
}
