import { useEffect, useRef } from "react";

/**
 * Site-wide mouse effect: a soft violet→magenta glow that follows the cursor,
 * plus a small crisp dot. Disabled on touch devices and when the user prefers
 * reduced motion. Pointer-events-none so it never blocks interaction.
 */
export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const glow = glowRef.current;
    const dot = dotRef.current;
    if (!glow || !dot) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let glowX = mouseX;
    let glowY = mouseY;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate3d(${mouseX - 4}px, ${mouseY - 4}px, 0)`;
      glow.style.opacity = "1";
    };
    const onLeave = () => {
      glow.style.opacity = "0";
      dot.style.opacity = "0";
    };
    const onEnter = () => {
      dot.style.opacity = "1";
    };

    const tick = () => {
      glowX += (mouseX - glowX) * 0.15;
      glowY += (mouseY - glowY) * 0.15;
      glow.style.transform = `translate3d(${glowX - 200}px, ${glowY - 200}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      const interactive = !!t?.closest("a,button,[role='button'],input,textarea,select,label,summary");
      dot.style.width = interactive ? "28px" : "8px";
      dot.style.height = interactive ? "28px" : "8px";
      dot.style.marginLeft = interactive ? "-14px" : "-4px";
      dot.style.marginTop = interactive ? "-14px" : "-4px";
      dot.style.borderColor = interactive ? "rgba(217, 70, 239, 0.9)" : "rgba(255,255,255,0.85)";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <div
        ref={glowRef}
        style={{
          width: 400,
          height: 400,
          background:
            "radial-gradient(circle, rgba(124,58,237,0.28) 0%, rgba(217,70,239,0.14) 35%, rgba(217,70,239,0) 70%)",
          filter: "blur(20px)",
          opacity: 0,
          transition: "opacity 300ms ease",
          willChange: "transform, opacity",
        }}
        className="absolute left-0 top-0"
      />
      <div
        ref={dotRef}
        style={{
          width: 8,
          height: 8,
          borderRadius: 9999,
          border: "1.5px solid rgba(255,255,255,0.85)",
          transition:
            "width 180ms ease, height 180ms ease, margin 180ms ease, border-color 180ms ease, opacity 200ms ease",
          willChange: "transform",
          mixBlendMode: "difference",
        }}
        className="absolute left-0 top-0"
      />
    </div>
  );
}