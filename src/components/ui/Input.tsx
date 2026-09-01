import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="label text-[var(--ink-2)]">{label}</label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-11 rounded-[var(--radius)] bg-[var(--panel)] border border-[var(--ink-3)] px-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] transition-colors duration-150 focus:outline-none focus:border-[var(--brick)] focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-40 ${error ? "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/30" : ""} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
