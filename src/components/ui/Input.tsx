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
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-11 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] px-4 text-sm text-white placeholder:text-[var(--text-muted)] transition-all duration-200 focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-40 ${error ? "border-[var(--red)] focus:ring-[var(--red)]/30" : ""} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-[var(--red)]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
