"use client";

import { ButtonHTMLAttributes, forwardRef, useCallback, useRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "whatsapp";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Hard offset "stamp" shadow for key CTAs (Field Guide signature). */
  block?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-[var(--brick)] text-[var(--panel)] hover:bg-[var(--brick-ink)] border border-[var(--brick)]",
  secondary: "bg-[var(--sky-wash)] text-[var(--sky-ink)] border border-[var(--sky)]/35 hover:bg-[var(--sky)] hover:text-[var(--panel)] hover:border-[var(--sky)]",
  outline: "bg-transparent text-[var(--ink)] border border-[var(--line)] hover:border-[var(--sky)] hover:text-[var(--sky-ink)]",
  ghost: "bg-transparent text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] border border-transparent",
  destructive: "bg-[var(--danger)] text-white hover:opacity-90 border border-[var(--danger)]",
  whatsapp: "bg-[var(--whatsapp)] text-white hover:opacity-90 border border-[var(--whatsapp)]",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", block = false, className = "", onClick, children, ...props }, ref) => {
    const innerRef = useRef<HTMLButtonElement>(null);
    const buttonRef = (ref as React.RefObject<HTMLButtonElement>) || innerRef;

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      const el = buttonRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const sz = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - sz / 2;
        const y = e.clientY - rect.top - sz / 2;
        const ripple = document.createElement("span");
        ripple.className = "ripple-effect active";
        ripple.style.cssText = `width:${sz}px;height:${sz}px;left:${x}px;top:${y}px`;
        el.appendChild(ripple);
        ripple.addEventListener("animationend", () => ripple.remove());
      }
      onClick?.(e);
    }, [onClick, buttonRef]);

    return (
      <button
        ref={buttonRef}
        className={`ripple inline-flex items-center justify-center rounded-[var(--radius)] font-display font-bold tracking-tight transition-[background-color,color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-40 active:translate-y-px ${variantStyles[variant]} ${sizeStyles[size]} ${block ? "shadow-block hover:-translate-y-px active:translate-y-0 active:shadow-warm-1" : ""} ${className}`}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
export type { ButtonProps };
