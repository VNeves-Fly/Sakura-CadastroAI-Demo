// Porta pro cadastro conseguir puxar um arquivo recebido no chat
// (módulo atendimento, MensagemMidia) sem depender do domínio de lá —
// o repositório real (PrismaMensagemRepository, já em atendimento)
// implementa `findMidiaById` com exatamente este formato, então
// satisfaz esta interface estruturalmente sem precisar de adapter
// próprio; a composição acontece só no controller (ver
// cadastro-admin.controller.ts).
export interface MidiaOrigemInfo {
  gcsPath: string;
  gcsBucket: string | null;
  mimeType: string | null;
  fileName: string | null;
}

export interface MidiaOrigemRepository {
  findMidiaById(id: string): Promise<MidiaOrigemInfo | null>;
}
