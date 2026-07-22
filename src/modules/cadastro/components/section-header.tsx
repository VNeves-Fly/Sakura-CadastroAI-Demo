import type { ReactNode } from "react";

interface SectionHeaderProps {
  children: ReactNode;
}

export function SectionHeader({ children }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="bg-primary h-4 w-1 rounded-full" />
      <h2 className="text-primary text-xs font-bold tracking-wide uppercase">{children}</h2>
    </div>
  );
}
