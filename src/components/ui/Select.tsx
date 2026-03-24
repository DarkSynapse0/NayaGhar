import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, className = "", id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={selectId} className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>}
        <select
          ref={ref}
          id={selectId}
          className={`h-11 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] px-4 text-sm text-[var(--text)] transition-all duration-200 focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-40 ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
