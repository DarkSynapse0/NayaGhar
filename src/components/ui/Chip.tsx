"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: React.ReactNode;
}

// Filter/toggle chip. Selected = brick fill; idle = paper with ink outline.
const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ selected, icon, children, className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[var(--radius)] text-[13px] font-semibold transition-colors duration-150 border ${
        selected
          ? "bg-[var(--brick)] text-[var(--panel)] border-[var(--brick)]"
          : "bg-[var(--panel)] text-[var(--ink-2)] border-[var(--line)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
      } ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
);
Chip.displayName = "Chip";

export { Chip };
