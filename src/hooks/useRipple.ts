"use client";

import { useCallback, useRef } from "react";

export function useRipple() {
  const ref = useRef<HTMLElement>(null);

  const createRipple = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.className = "ripple-effect active";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    el.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  }, []);

  return { ref, createRipple };
}
