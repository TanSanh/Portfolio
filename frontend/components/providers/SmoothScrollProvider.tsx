"use client";

import { useEffect } from "react";
import Lenis from "lenis";

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const shouldEnable = () =>
      !motionQuery.matches && window.innerWidth >= 1024; // tránh ngốn tài nguyên trên mobile

    let lenis: Lenis | null = null;

    const initLenis = () => {
      if (lenis) return;
      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false,
      });

      const raf = (time: number) => {
        lenis?.raf(time);
        if (lenis) {
          requestAnimationFrame(raf);
        }
      };

      requestAnimationFrame(raf);
    };

    const destroyLenis = () => {
      if (!lenis) return;
      lenis.destroy();
      lenis = null;
    };

    if (shouldEnable()) {
      initLenis();
    }

    const handleChange = () => {
      if (shouldEnable()) {
        initLenis();
      } else {
        destroyLenis();
      }
    };

    window.addEventListener("resize", handleChange);
    motionQuery.addEventListener?.("change", handleChange);

    return () => {
      window.removeEventListener("resize", handleChange);
      motionQuery.removeEventListener?.("change", handleChange);
      destroyLenis();
    };
  }, []);

  return <>{children}</>;
}
