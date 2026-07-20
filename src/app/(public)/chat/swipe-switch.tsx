"use client";

interface SwipeSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

export function SwipeSwitch({ checked, onChange, id }: SwipeSwitchProps) {
  return (
    <label
      htmlFor={id}
      className="bg-destructive/70 has-[:checked]:bg-success relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="ml-1 size-5 rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out peer-checked:translate-x-5"
      />
    </label>
  );
}
