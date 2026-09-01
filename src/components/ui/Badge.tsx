import { HTMLAttributes, forwardRef } from "react";

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "highlight" | "geo";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

// Status chips — functional color, always readable as a label (not color-alone).
const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--paper-2)] text-[var(--ink-2)] border-[var(--line)]",
  success: "bg-[var(--verified-wash)] text-[var(--verified)] border-[var(--verified)]/30",
  warning: "bg-[var(--pending-wash)] text-[var(--pending)] border-[var(--pending)]/40",
  destructive: "bg-[var(--danger-wash)] text-[var(--danger)] border-[var(--danger)]/30",
  highlight: "bg-[var(--brick-wash)] text-[var(--brick)] border-[var(--brick)]/30",
  geo: "bg-[var(--geo-wash)] text-[var(--geo)] border-[var(--geo)]/30",
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", className = "", ...props }, ref) => (
    <span
      ref={ref}
      className={`label inline-flex items-center gap-1 rounded-[var(--radius-sm)] border px-2 py-1 ${variantStyles[variant]} ${className}`}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge };
