"use client";

import { CalendarIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const FORMATO_ISO = "yyyy-MM-dd";

function paraDate(valorIso: string): Date | undefined {
  if (!valorIso) return undefined;
  const data = parse(valorIso, FORMATO_ISO, new Date());
  return isValid(data) ? data : undefined;
}

interface DatePickerProps {
  id?: string;
  // Mesmo formato ISO (yyyy-MM-dd) que <input type="date"> já usava nos
  // dois lugares que consomem isso — troca só o calendário, não o
  // contrato de dado que o resto do código já espera.
  value: string;
  onChange: (valorIso: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  // Repassado pro DayPicker (ex.: disabled={{ after: new Date() }} pra
  // bloquear datas futuras numa data de nascimento).
  disabledDays?: React.ComponentProps<typeof Calendar>["disabled"];
  captionLayout?: React.ComponentProps<typeof Calendar>["captionLayout"];
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Selecione uma data",
  disabled = false,
  className,
  disabledDays,
  captionLayout = "dropdown",
}: DatePickerProps) {
  const dataSelecionada = paraDate(value);

  return (
    <Popover>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        className={cn(
          "border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 flex w-full items-center gap-2 rounded-full border px-4 py-2.5 text-left text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        <CalendarIcon className="text-muted-foreground size-4 shrink-0" />
        <span className={dataSelecionada ? "text-foreground" : "text-muted-foreground"}>
          {dataSelecionada ? format(dataSelecionada, "dd/MM/yyyy", { locale: ptBR }) : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout={captionLayout}
          selected={dataSelecionada}
          onSelect={(data) => onChange(data ? format(data, FORMATO_ISO) : "")}
          disabled={disabledDays}
          defaultMonth={dataSelecionada}
        />
      </PopoverContent>
    </Popover>
  );
}
