"use client";

interface SwipeSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
}

export function SwipeSwitch({ checked, onChange, id, disabled = false }: SwipeSwitchProps) {
  return (
    <label
      htmlFor={id}
      className="bg-destructive/70 has-[:checked]:bg-success relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="ml-1 size-6 rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out peer-checked:translate-x-6"
      />
    </label>
  );
}
