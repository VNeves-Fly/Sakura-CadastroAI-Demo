import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaEventoRepository } from "@/modules/eventos/infrastructure/repositories/prisma-evento.repository";
import { CriarEventoUseCase } from "@/modules/eventos/application/use-cases/criar-evento.use-case";
import type { CriarEventoInput } from "@/modules/eventos/application/use-cases/criar-evento.use-case";
import { ListarEventosUseCase } from "@/modules/eventos/application/use-cases/listar-eventos.use-case";

const eventoRepository = new PrismaEventoRepository(prisma);

export const eventosAdminController = {
  listarEventos() {
    const useCase = new ListarEventosUseCase(eventoRepository);
    return useCase.execute();
  },

  // Usado pelo cadastro público (page.tsx) só pra validar que o `?evento=`
  // do link é um slug real antes de gravar Agencia.eventoId — não passa
  // pelo guard de sessão (não é uma ação de escrita nem expõe dado
  // sensível, só id/nome/ativo do evento).
  buscarEventoPorSlug(slug: string) {
    return eventoRepository.findBySlug(slug);
  },

  criarEvento(input: CriarEventoInput) {
    const useCase = new CriarEventoUseCase(eventoRepository);
    return useCase.execute(input);
  },
};
