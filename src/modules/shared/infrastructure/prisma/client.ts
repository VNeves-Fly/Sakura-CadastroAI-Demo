import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

// Cloud SQL's legacy per-instance CA doesn't put the connection IP in the
// cert's SAN, so hostname verification (sslmode=verify-full) always fails —
// we verify the chain against the instance's own CA (verify-ca) and skip
// the hostname check instead of falling back to sslmode=no-verify.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ...(process.env.DATABASE_CA_CERT && {
    ssl: {
      ca: process.env.DATABASE_CA_CERT,
      rejectUnauthorized: true,
      checkServerIdentity: () => undefined,
    },
  }),
});

export const prisma = globalThis.prismaGlobal ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
