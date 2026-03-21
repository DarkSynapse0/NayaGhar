"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: React.ReactNode;
}

const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ selected, icon, children, className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg label-large transition-all duration-200 border ${
        selected
          ? "bg-secondary-container text-on-secondary-container border-transparent elevation-1"
          : "bg-transparent text-muted-foreground border-outline-variant hover:bg-surface-container-high"
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
