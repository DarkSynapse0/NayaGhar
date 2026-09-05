"use client";

import { InputHTMLAttributes, ReactNode, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface IconFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Leading glyph, e.g. <Phone className="w-4 h-4" />. */
  icon: ReactNode;
  /** Renders a show/hide eye toggle and manages the password type. */
  password?: boolean;
}

// Soft, filled input with a leading icon — matches the auth reference style.
const IconField = forwardRef<HTMLInputElement, IconFieldProps>(
  ({ icon, password = false, type = "text", className = "", "aria-label": ariaLabel, placeholder, ...props }, ref) => {
    const [show, setShow] = useState(false);
    const inputType = password ? (show ? "text" : "password") : type;
    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)]">
          {icon}
        </span>
        <input
          ref={ref}
          type={inputType}
          placeholder={placeholder}
          aria-label={ariaLabel || placeholder}
          className={`h-12 w-full rounded-[var(--radius)] bg-[var(--paper-2)] border border-[var(--line)] pl-11 ${password ? "pr-11" : "pr-3.5"} text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] transition-colors duration-150 focus:outline-none focus:bg-[var(--panel)] focus:border-[var(--sky)] focus:ring-2 focus:ring-[var(--sky)]/25 ${className}`}
          {...props}
        />
        {password && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    );
  }
);
IconField.displayName = "IconField";

export { IconField };
