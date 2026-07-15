import type { ReactNode } from "react";
import { rubik } from "@/modules/shared/presentation/fonts";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className={rubik.className}>{children}</div>;
}
