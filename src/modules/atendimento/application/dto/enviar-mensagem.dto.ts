import type { TipoMensagemEntity } from "@/modules/atendimento/domain/entities/mensagem.entity";

export interface EnviarMensagemInput {
  conversaId: string;
  // Sempre resolvido a partir da sessão do analista na rota — nunca de um
  // campo de body vindo do cliente.
  analistaId: string;
  tipo: TipoMensagemEntity;
  conteudo: string;
  duracaoSegundos?: number;
  tamanhoArquivo?: string;
  // Presentes só quando `conteudo` veio de um template aprovado (picker
  // de template em ThreadConversa) — `conteudo` já chega com os {{n}}
  // substituídos pro valor digitado (usado como texto/preview em
  // qualquer janela); `variaveis` é a lista posicional crua que a Meta
  // exige nos `parameters` do template quando a janela de 24h tá fechada.
  templateId?: string;
  variaveis?: string[];
}
