# deps — install dependencies (husky's prepare script needs HUSKY=0, sem .git no build)
# nota: bug do bun 1.3.13/1.3.14 (oven-sh/bun#34821, fix pendente em bun PR #34827) —
# download de tarball grande (>=2MB, caso do "next") que é cortado no meio não é
# re-tentado no path de streaming, e falha com "Fail extracting tarball for X".
# a flag abaixo desativa esse path como workaround; remover quando o fix for lançado.
FROM oven/bun:latest AS deps
WORKDIR /app
ENV HUSKY=0
ENV BUN_FEATURE_FLAG_DISABLE_STREAMING_INSTALL=1
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# builder — gera o Prisma Client e compila o Next.js (output: "standalone")
FROM oven/bun:latest AS builder
WORKDIR /app
ENV HUSKY=0
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run db:generate && bun run build

# runner — imagem mínima de produção
FROM oven/bun:latest AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["bun", "server.js"]
