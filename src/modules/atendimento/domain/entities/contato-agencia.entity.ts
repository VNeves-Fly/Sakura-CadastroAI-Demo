import type { PapelMembroEntity } from "@/modules/atendimento/domain/entities/conversa.entity";

// Um número de WhatsApp candidato de uma agência (Comercial ou sócio) —
// mesmas 3 fontes que WhatsAppContactMatcherAdapter usa pra resolver
// telefone → contato (aqui é o caminho inverso: agência → telefones).
// `conversaId` é null quando o número nunca trocou mensagem — nesse caso
// IniciarConversaUseCase cria a Conversa na hora que o analista escolhe.
export interface NumeroContatoEntity {
  label: string;
  telefone: string;
  papel: PapelMembroEntity;
  representanteLegalId: string | null;
  agenciaId: string;
  conversaId: string | null;
}

export interface ContatoAgenciaEntity {
  agenciaId: string;
  agenciaNome: string;
  cnpj: string;
  numeros: NumeroContatoEntity[];
}
