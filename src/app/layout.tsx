import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthSessionProvider } from "@/modules/auth/components/session-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cadastro IA Sakura",
  description: "Plataforma de cadastro e gerenciamento de informações.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-background text-foreground min-h-screen font-sans antialiased">
        <AuthSessionProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
