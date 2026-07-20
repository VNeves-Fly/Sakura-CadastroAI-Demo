import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticateController } from "@/modules/auth/presentation/controllers/auth.controller";

// Providers são configuráveis: novos providers (OAuth, email, etc.) podem ser
// adicionados ao array abaixo sem alterar o restante do módulo.
export const nextAuthOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await authenticateController(credentials.email, credentials.password);

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.mustChangePassword = user.mustChangePassword;
      }

      // Disparado por useSession().update({ mustChangePassword: false })
      // depois que o usuário troca a senha no primeiro acesso — evita
      // exigir um novo login só pra refletir a flag no token.
      if (trigger === "update" && session?.mustChangePassword !== undefined) {
        token.mustChangePassword = session.mustChangePassword;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
