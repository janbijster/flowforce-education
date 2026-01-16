interface FilterSelectProps<T extends { id: number; name: string }> {
  label: string;
  value: number | null;
  options: T[];
  onChange: (id: number | null) => void;
  allLabel: string;
  disabled?: boolean;
  displayFn?: (item: T) => string;
  fullWidth?: boolean;
  wrapperClassName?: string;
}

export function FilterSelect<T extends { id: number; name: string }>({
  label,
  value,
  options,
  onChange,
  allLabel,
  disabled = false,
  displayFn = (item) => item.name,
  fullWidth = false,
  wrapperClassName,
}: FilterSelectProps<T>) {
  return (
    <div className={wrapperClassName ?? (fullWidth ? "" : "mb-4")}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        className={`w-full rounded-md border px-3 py-2 text-sm${fullWidth ? "" : " max-w-xs"}${disabled ? " disabled:opacity-50" : ""}`}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        disabled={disabled}
      >
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {displayFn(opt)}
          </option>
        ))}
      </select>
    </div>
  );
}
