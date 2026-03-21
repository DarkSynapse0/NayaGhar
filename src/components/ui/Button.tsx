"use client";

import { ButtonHTMLAttributes, forwardRef, useCallback, useRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "whatsapp";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
  secondary: "bg-white text-[var(--bg)] hover:bg-white/90",
  outline: "border border-[var(--border-hover)] text-white hover:bg-[var(--bg-hover)]",
  ghost: "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)]",
  destructive: "bg-[var(--red)] text-white hover:bg-[var(--red)]/80",
  whatsapp: "bg-[#25D366] text-white hover:bg-[#1ebe5a]",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-sm gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", onClick, children, ...props }, ref) => {
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
        className={`ripple inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97] ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
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
