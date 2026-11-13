"use client";

import { Canvas } from "@react-three/fiber";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Particles } from "./particles";

const TINT_DARK = "#E8E3D6"; // warm cream on dark slate
const TINT_LIGHT = "#C01A30"; // crimson on paper cream

export function WebglBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!mounted) return <StaticFallback />;
  if (reduceMotion) return <StaticFallback />;

  const tint = resolvedTheme === "light" ? TINT_LIGHT : TINT_DARK;

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <Canvas
        camera={{
          position: [1.2629783123314589, 2.664606471394044, -1.8178993743288914],
          fov: 50,
          near: 0.01,
          far: 300,
        }}
        gl={{ antialias: true, alpha: true }}
      >
        <Particles tint={tint} />
      </Canvas>
    </div>
  );
}

function StaticFallback() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse at 70% 40%, color-mix(in oklch, var(--primary) 14%, transparent), transparent 60%)",
      }}
    />
  );
}
