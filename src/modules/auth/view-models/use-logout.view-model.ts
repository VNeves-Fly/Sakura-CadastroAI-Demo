"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authService } from "@/modules/auth/services/auth.service";

export function useLogoutViewModel() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    setIsLoggingOut(true);
    await authService.logout();
    setIsLoggingOut(false);
    router.push("/login");
    router.refresh();
  }

  return { isLoggingOut, logout };
}
