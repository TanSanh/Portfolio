"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const LazyFallingEffects = dynamic(
  () =>
    import("./FallingEffects").then((mod) => ({
      default: mod.FallingEffects,
    })),
  { ssr: false, loading: () => null }
);

export function EffectsLayer() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateState = () => {
      setEnabled(!motionQuery.matches && window.innerWidth >= 768);
    };

    updateState();

    const handleResize = () => updateState();
    window.addEventListener("resize", handleResize);
    motionQuery.addEventListener?.("change", updateState);

    return () => {
      window.removeEventListener("resize", handleResize);
      motionQuery.removeEventListener?.("change", updateState);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return <LazyFallingEffects type="stars" color="#22d3ee" intensity="low" />;
}

