"use client";

interface TaskSelectCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export default function TaskSelectCheckbox({
  checked,
  onChange,
  label,
}: TaskSelectCheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => {
        event.stopPropagation();
        onChange(event.target.checked);
      }}
      onClick={(event) => event.stopPropagation()}
      aria-label={label}
      className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900"
    />
  );
}
