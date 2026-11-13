"use client";

import dynamic from "next/dynamic";

// Client wrapper so ssr:false is legal (not allowed in Server Components).
const WebglBackgroundInner = dynamic(
  () => import("@/components/gl/background").then((m) => m.WebglBackground),
  { ssr: false },
);

export function HeroBackground() {
  return <WebglBackgroundInner />;
}
