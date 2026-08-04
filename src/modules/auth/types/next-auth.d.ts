import type { DefaultSession, DefaultUser } from "next-auth";
import type { Cargo } from "@/modules/users/domain/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      mustChangePassword: boolean;
      cargo: Cargo;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    mustChangePassword: boolean;
    cargo: Cargo;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    mustChangePassword: boolean;
    cargo: Cargo;
  }
}
