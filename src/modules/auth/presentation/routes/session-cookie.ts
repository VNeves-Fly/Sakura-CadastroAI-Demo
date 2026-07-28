// Isolado de next-auth.options.ts de propósito: middleware.ts roda no Edge
// Runtime e não pode importar nada que puxe Prisma/bcrypt (via
// CredentialsProvider/authenticateController) — isso quebra o bundle do
// middleware com "Attempting to change value of a readonly property" (Node
// APIs não suportadas no Edge). Ver next-auth/jwt: getToken() deriva o nome
// do cookie de forma independente do resto do next-auth, só olhando
// NEXTAUTH_URL/VERCEL — por isso fixamos aqui explicitamente.
export const useSecureCookies = process.env.NODE_ENV === "production";

export const sessionCookieName = useSecureCookies
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token";
