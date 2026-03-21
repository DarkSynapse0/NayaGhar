"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}

export function AnimatedSection({ children, className = "", stagger = 0.1, delay = 0 }: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const childEls = el.children;
    gsap.set(childEls, { opacity: 0, y: 30 });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(childEls, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger,
            delay,
            ease: "power3.out",
          });
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [stagger, delay]);

  return <div ref={ref} className={className}>{children}</div>;
}

export function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.set(el, { opacity: 0, y: 24 });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(el, { opacity: 1, y: 0, duration: 0.7, delay, ease: "power3.out" });
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return <div ref={ref} className={className}>{children}</div>;
}
