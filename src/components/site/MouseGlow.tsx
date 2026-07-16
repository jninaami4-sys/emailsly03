import { useEffect, useRef, useState } from "react";

function StaticAmbientGlow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
    >
      <div className="pointer-events-none absolute left-1/2 top-[30%] size-[70vw] max-w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,var(--violet)_0%,transparent_70%)] opacity-[0.08] blur-3xl" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-10%] size-[60vw] max-w-[540px] rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.35)_0%,transparent_65%)] opacity-25 blur-3xl" />
    </div>
  );
}

export function MouseGlow() {
  const auraRef = useRef<HTMLDivElement | null>(null);
  const haloRef = useRef<HTMLDivElement | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const aura = useRef({ x: 0, y: 0 });
  const halo = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"interactive" | "static">("interactive");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isCoarse = window.matchMedia?.("(pointer: coarse)")?.matches;
    const noHover = window.matchMedia?.("(hover: none)")?.matches;
    if (isCoarse || noHover) setMode("static");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || mode !== "interactive") return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduced) {
      setMode("static");
      return;
    }

    target.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    aura.current = { ...target.current };
    halo.current = { ...target.current };

    const handleMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (!visible) setVisible(true);
    };
    const handleLeave = () => setVisible(false);
    const handleEnter = () => setVisible(true);

    const tick = () => {
      // Silky layered easing — no visible cursor artifact
      aura.current.x += (target.current.x - aura.current.x) * 0.06;
      aura.current.y += (target.current.y - aura.current.y) * 0.06;
      halo.current.x += (target.current.x - halo.current.x) * 0.14;
      halo.current.y += (target.current.y - halo.current.y) * 0.14;

      if (auraRef.current) {
        auraRef.current.style.transform = `translate3d(${aura.current.x}px, ${aura.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (haloRef.current) {
        haloRef.current.style.transform = `translate3d(${halo.current.x}px, ${halo.current.y}px, 0) translate(-50%, -50%)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    window.addEventListener("mousemove", handleMove, { passive: true });
    document.addEventListener("mouseleave", handleLeave);
    document.addEventListener("mouseenter", handleEnter);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
      document.removeEventListener("mouseenter", handleEnter);
    };
  }, [visible, mode]);

  if (mode === "static") return <StaticAmbientGlow />;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Wide ambient aura — brand violet, deeply blurred */}
      <div
        ref={auraRef}
        className="pointer-events-none absolute left-0 top-0 size-[720px] rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in oklab, var(--violet) 55%, transparent) 0%, transparent 65%)",
          opacity: 0.14,
          filter: "blur(80px)",
          mixBlendMode: "screen",
        }}
      />
      {/* Tighter halo — subtle accent shimmer */}
      <div
        ref={haloRef}
        className="pointer-events-none absolute left-0 top-0 size-[320px] rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in oklab, var(--violet) 70%, transparent) 0%, transparent 70%)",
          opacity: 0.18,
          filter: "blur(40px)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
