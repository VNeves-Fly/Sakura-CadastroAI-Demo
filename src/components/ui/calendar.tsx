"use client";

import * as React from "react";
import { DayPicker } from "@daypicker/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// Estilizado na mão via `classNames` (em vez do CSS padrão do
// react-day-picker) pra usar as mesmas cores de marca do resto do
// sistema (primary/sakura) — sem depender do stylesheet default do
// pacote, que não bate com o tema.
function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-2",
        month: "flex flex-col gap-3",
        month_caption: "flex items-center justify-center pt-1 relative",
        caption_label:
          "pointer-events-none flex items-center gap-1 text-sm font-semibold text-foreground",
        dropdowns: "flex items-center gap-1.5",
        dropdown_root:
          "relative inline-flex items-center rounded-full border border-input bg-background px-3 py-1.5 hover:bg-accent",
        dropdown: "absolute inset-0 z-10 cursor-pointer opacity-0",
        chevron: "size-3.5 text-muted-foreground",
        nav: "flex items-center justify-between absolute inset-x-0 top-0",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 rounded-full p-0 opacity-70 hover:opacity-100",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 rounded-full p-0 opacity-70 hover:opacity-100",
        ),
        month_grid: "w-full border-collapse mt-2",
        weekdays: "flex",
        weekday: "text-muted-foreground w-9 text-[0.75rem] font-medium",
        week: "flex w-full mt-1",
        day: "size-9 p-0 text-center text-sm",
        day_button: cn(
          "size-9 rounded-full text-sm font-medium transition-colors",
          "hover:bg-primary/10 hover:text-primary",
          "focus-visible:ring-ring/30 focus-visible:ring-2 focus-visible:outline-none",
        ),
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-sakura-600",
        today: "[&>button]:border [&>button]:border-primary/50",
        outside: "text-muted-foreground/40",
        disabled: "text-muted-foreground/30 opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
