"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Animate elements in on scroll using GSAP.
 */
export function useScrollReveal(stagger = 0.1) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const children = el.children;
    if (children.length === 0) return;

    gsap.set(children, { opacity: 0, y: 30 });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(children, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger,
            ease: "power3.out",
          });
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [stagger]);

  return containerRef;
}

/**
 * Animate a single element on mount.
 */
export function useEnterAnimation(
  from: gsap.TweenVars = { opacity: 0, y: 24 },
  to: gsap.TweenVars = { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current, from, to);
  }, []);

  return ref;
}

/**
 * Hover scale animation.
 */
export function useHoverScale(scale = 1.02) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onEnter = () => gsap.to(el, { scale, duration: 0.25, ease: "power2.out" });
    const onLeave = () => gsap.to(el, { scale: 1, duration: 0.25, ease: "power2.out" });

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [scale]);

  return ref;
}
