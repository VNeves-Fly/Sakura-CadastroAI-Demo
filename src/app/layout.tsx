import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthSessionProvider } from "@/modules/auth/components/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cadastro IA Sakura",
  description: "Plataforma de cadastro e gerenciamento de informações.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
