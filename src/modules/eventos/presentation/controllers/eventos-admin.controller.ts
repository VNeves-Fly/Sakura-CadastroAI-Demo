import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaEventoRepository } from "@/modules/eventos/infrastructure/repositories/prisma-evento.repository";
import { CriarEventoUseCase } from "@/modules/eventos/application/use-cases/criar-evento.use-case";
import { CriarEventoLinkUseCase } from "@/modules/eventos/application/use-cases/criar-evento-link.use-case";
import { ListarEventosUseCase } from "@/modules/eventos/application/use-cases/listar-eventos.use-case";
import { AlternarAtivoEventoLinkUseCase } from "@/modules/eventos/application/use-cases/alternar-ativo-evento-link.use-case";
import type { CriarEventoLinkData } from "@/modules/eventos/domain/repositories/evento-repository";

const eventoRepository = new PrismaEventoRepository(prisma);

export const eventosAdminController = {
  listarEventos() {
    const useCase = new ListarEventosUseCase(eventoRepository);
    return useCase.execute();
  },

  // Usado pelo cadastro público (page.tsx) só pra validar que o
  // `?evento=` do link é um id real antes de gravar Agencia.eventoId —
  // não passa pelo guard de sessão (não é uma ação de escrita nem expõe
  // dado sensível, só id/nome/ativo do evento).
  buscarEvento(id: string) {
    return eventoRepository.findById(id);
  },

  criarEvento(nome: string) {
    const useCase = new CriarEventoUseCase(eventoRepository);
    return useCase.execute(nome);
  },

  criarEventoLink(data: CriarEventoLinkData) {
    const useCase = new CriarEventoLinkUseCase(eventoRepository);
    return useCase.execute(data);
  },

  alternarAtivoLink(linkId: string) {
    const useCase = new AlternarAtivoEventoLinkUseCase(eventoRepository);
    return useCase.execute(linkId);
  },
};
