import { useEffect, useRef, useState } from "react";

export function MouseGlow() {
  const glowRef = useRef<HTMLDivElement | null>(null);
  const trailRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const glow = useRef({ x: 0, y: 0 });
  const trail = useRef({ x: 0, y: 0 });
  const dot = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isCoarse = window.matchMedia?.("(pointer: coarse)")?.matches;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (isCoarse || reduced) return;

    target.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    glow.current = { ...target.current };
    trail.current = { ...target.current };
    dot.current = { ...target.current };

    const handleMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (!visible) setVisible(true);
    };

    const handleLeave = () => setVisible(false);
    const handleEnter = () => setVisible(true);

    const tick = () => {
      // Different easings for a layered, silky feel
      glow.current.x += (target.current.x - glow.current.x) * 0.08;
      glow.current.y += (target.current.y - glow.current.y) * 0.08;

      trail.current.x += (target.current.x - trail.current.x) * 0.18;
      trail.current.y += (target.current.y - trail.current.y) * 0.18;

      dot.current.x += (target.current.x - dot.current.x) * 0.35;
      dot.current.y += (target.current.y - dot.current.y) * 0.35;

      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${glow.current.x}px, ${glow.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (trailRef.current) {
        trailRef.current.style.transform = `translate3d(${trail.current.x}px, ${trail.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dot.current.x}px, ${dot.current.y}px, 0) translate(-50%, -50%)`;
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
  }, [visible]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Soft ambient glow — lags farthest behind */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute left-0 top-0 size-[600px] rounded-full bg-[radial-gradient(circle_at_center,var(--violet)_0%,transparent_70%)] opacity-[0.10] blur-3xl will-change-transform"
      />
      {/* Mid trail — subtle secondary hue */}
      <div
        ref={trailRef}
        className="pointer-events-none absolute left-0 top-0 size-[220px] rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.35)_0%,transparent_65%)] opacity-40 blur-2xl will-change-transform"
      />
      {/* Crisp cursor dot — nearly 1:1 with pointer */}
      <div
        ref={dotRef}
        className="pointer-events-none absolute left-0 top-0 size-2 rounded-full bg-white/70 shadow-[0_0_18px_rgba(255,255,255,0.6)] will-change-transform"
      />
    </div>
  );
}
