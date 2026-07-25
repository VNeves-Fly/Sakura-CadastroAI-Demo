import type { PrismaClient } from "@prisma/client";

// Fonte real: export do banco de associações
// (associacoes-export-2026-07-24_18-58-37.csv), enviado pelo usuário em
// 2026-07-24 — `id`/`createdAt`/`updatedAt` preservados exatamente como
// vieram (não gerados aqui), pra bater com a fonte original.
const ASSOCIACOES: Array<{
  id: string;
  nome: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}> = [
  {
    id: "435a0d3d-6611-40ae-bbb4-410b4e26576f",
    nome: "NÃO TENHO",
    ativo: true,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:25:40.311193Z",
  },
  {
    id: "84f63eb2-80fe-4948-b209-f7337d707fb8",
    nome: "PROTUR",
    ativo: true,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:25:40.311193Z",
  },
  {
    id: "87c37218-a85d-4d59-8353-e34d6c4dfd9d",
    nome: "TIX TURISMO",
    ativo: true,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:25:40.311193Z",
  },
  {
    id: "c50986c2-09e9-4137-8cc1-10da0638fc1a",
    nome: "AIRMET",
    ativo: true,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:25:40.311193Z",
  },
  {
    id: "2657fdd0-b437-48cb-9d88-b40ee058ecca",
    nome: "REDETUR",
    ativo: true,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:25:40.311193Z",
  },
  {
    id: "cbdadb3b-bb3f-4d33-9736-04ff7d0f5de9",
    nome: "321 GO TRAVEL",
    ativo: true,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:25:40.311193Z",
  },
  {
    id: "a88117df-43d5-4598-8bec-02f5ff74d42a",
    nome: "GEA",
    ativo: true,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:25:40.311193Z",
  },
  {
    id: "c1647350-27bd-4d38-a166-508721582d4c",
    nome: "AVAP",
    ativo: true,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:25:40.311193Z",
  },
  {
    id: "129cb9f9-e36c-45b8-9ead-9efbe957eec8",
    nome: "SO AGENTES",
    ativo: true,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:25:40.311193Z",
  },
  {
    id: "eddc15e7-fc07-4a6b-813b-7469ada6775c",
    nome: "GO AGENTES",
    ativo: true,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:25:40.311193Z",
  },
  {
    id: "3c6e3d61-21b7-4a79-bce7-d076b0a655ac",
    nome: "SABRINA BULL",
    ativo: true,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:25:40.311193Z",
  },
  {
    id: "d3bdaebc-6308-4e2e-831d-170d9c84a62d",
    nome: "INTEGRAÇÃO TRADE",
    ativo: true,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:25:40.311193Z",
  },
  {
    id: "f58ece47-ee53-4578-a0a1-388cff11b702",
    nome: "ROGERIA PINHEIRO",
    ativo: true,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:25:40.311193Z",
  },
  {
    id: "37708976-e07c-407b-a49c-566d3fe1a729",
    nome: "DUARTE",
    ativo: true,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:25:40.311193Z",
  },
  {
    id: "3afcc3c9-7df5-42b2-ad66-ab808089f9a0",
    nome: "VIAJAFLUX",
    ativo: true,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:25:40.311193Z",
  },
  {
    id: "eba9a1c4-1488-42c2-baa0-da3a1c7c5ec6",
    nome: "AGX",
    ativo: true,
    createdAt: "2026-07-01T17:30:41.417578Z",
    updatedAt: "2026-07-01T17:30:41.417578Z",
  },
  {
    id: "a0dca499-258b-459c-91f9-ebc22b0caf6d",
    nome: "INOVVATUR",
    ativo: true,
    createdAt: "2026-07-01T17:30:41.417578Z",
    updatedAt: "2026-07-01T17:30:41.417578Z",
  },
  {
    id: "37e1c90e-11ab-4d84-ab2c-8795b9ae49ef",
    nome: "SAKURA SELECT",
    ativo: true,
    createdAt: "2026-07-01T17:30:41.417578Z",
    updatedAt: "2026-07-01T17:30:41.417578Z",
  },
  {
    id: "cac8eee2-d945-4c1a-8ae8-9c33328198d0",
    nome: "THE MENTHOR OF TRAVEL",
    ativo: true,
    createdAt: "2026-07-01T17:30:41.417578Z",
    updatedAt: "2026-07-01T17:30:41.417578Z",
  },
  {
    id: "b65f4572-ad75-4664-be3b-9e89627c8df2",
    nome: "TRIPIN",
    ativo: true,
    createdAt: "2026-07-01T17:30:41.417578Z",
    updatedAt: "2026-07-01T17:30:41.417578Z",
  },
  {
    id: "431558dc-6593-48ef-9f72-25f9cbd8e2aa",
    nome: "VOAR MAIS",
    ativo: true,
    createdAt: "2026-07-01T17:30:41.417578Z",
    updatedAt: "2026-07-01T17:30:41.417578Z",
  },
  {
    id: "2f134df5-f6c6-43c4-a58b-883c2eedf3e4",
    nome: "STELLA BARROS",
    ativo: false,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:30:41.417578Z",
  },
  {
    id: "80ec3b82-286f-4766-b69d-3a8e9d5b312d",
    nome: "TZ VIAGENS",
    ativo: false,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:30:41.417578Z",
  },
  {
    id: "fe3b7f73-07d3-4fd0-ab0b-20184167b173",
    nome: "SAKURINHA",
    ativo: false,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:30:41.417578Z",
  },
  {
    id: "4a0b7311-4f5e-4426-b83e-c9439374a880",
    nome: "ENTUR",
    ativo: false,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:30:41.417578Z",
  },
  {
    id: "d02dab64-b68e-417f-96ec-081163fccbe6",
    nome: "LUCAS FIALHO",
    ativo: false,
    createdAt: "2026-07-01T17:25:40.311193Z",
    updatedAt: "2026-07-01T17:30:41.417578Z",
  },
];

export async function seedAssociacoes(prisma: PrismaClient): Promise<void> {
  for (const associacao of ASSOCIACOES) {
    await prisma.associacao.upsert({
      where: { id: associacao.id },
      update: {
        nome: associacao.nome,
        ativo: associacao.ativo,
        updatedAt: new Date(associacao.updatedAt),
      },
      create: {
        id: associacao.id,
        nome: associacao.nome,
        ativo: associacao.ativo,
        createdAt: new Date(associacao.createdAt),
        updatedAt: new Date(associacao.updatedAt),
      },
    });
  }

  console.warn(`Seed: ${ASSOCIACOES.length} associações`);
}
