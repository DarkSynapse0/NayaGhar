import { HTMLAttributes, forwardRef } from "react";

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "highlight";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-white/8 text-[var(--text-secondary)]",
  success: "bg-emerald-500/15 text-emerald-400",
  warning: "bg-amber-500/15 text-amber-400",
  destructive: "bg-red-500/15 text-red-400",
  highlight: "bg-[var(--accent)]/15 text-[var(--accent)]",
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", className = "", ...props }, ref) => (
    <span
      ref={ref}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${variantStyles[variant]} ${className}`}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge };
