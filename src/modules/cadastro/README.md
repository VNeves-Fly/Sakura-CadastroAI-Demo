# Módulo `cadastro`

Skeleton reservado para a feature de negócio de cadastro (a ser detalhada em uma
próxima iteração). A estrutura de pastas já segue o mesmo padrão aplicado nos
módulos [`auth`](../auth) e [`users`](../users):

```
cadastro/
├── domain/            # entities, repositories (interfaces) e services — sem Prisma/framework
├── application/        # use-cases e dto — dependem apenas de abstrações do domain
├── infrastructure/      # prisma, repositories (implementações) e adapters
└── presentation/        # controllers e routes (composition root do módulo)

# camada MVVM (frontend), mesmo padrão de auth/users
├── views/
├── view-models/
├── adapters/
├── services/
├── stores/
├── types/
└── components/
```

Para implementar a feature real, siga o passo a passo do módulo `users`:

1. Modelar a entidade em `domain/entities` e a interface do repositório em `domain/repositories`.
2. Criar os use-cases em `application/use-cases` (um por operação de negócio).
3. Implementar o repositório concreto com Prisma em `infrastructure/repositories`.
4. Expor os endpoints via `presentation/controllers` + `presentation/routes`, plugando em `src/app/api/cadastro/*`.
5. No frontend, criar a view, o view-model, o adapter e o service correspondentes, seguindo o fluxo `View → ViewModel → Adapter → Service → API`.
