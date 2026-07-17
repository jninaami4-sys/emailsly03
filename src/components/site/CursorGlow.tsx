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
    let dotX = mouseX;
    let dotY = mouseY;
    let interactive = false;
    let prevInteractive: boolean | null = null;
    let visible = false;
    let raf = 0;
    let running = false;
    let idleTimer = 0;
    let lastOverTs = 0;

    // Idle threshold: if the pointer stops and the glow has caught up,
    // stop the RAF loop entirely so scroll / interactions are not taxed.
    const stopWhenSettled = () => {
      const dx = mouseX - glowX;
      const dy = mouseY - glowY;
      if (dx * dx + dy * dy < 0.25) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };

    const tick = () => {
      // Glow lerp
      glowX += (mouseX - glowX) * 0.15;
      glowY += (mouseY - glowY) * 0.15;
      glow.style.transform = `translate3d(${glowX - 200}px, ${glowY - 200}px, 0)`;

      // Dot follows the pointer 1:1, but written inside RAF (one style
      // write per frame regardless of mousemove frequency).
      dot.style.transform = `translate3d(${dotX - 4}px, ${dotY - 4}px, 0)`;

      if (prevInteractive !== interactive) {
        prevInteractive = interactive;
        dot.style.width = interactive ? "28px" : "8px";
        dot.style.height = interactive ? "28px" : "8px";
        dot.style.marginLeft = interactive ? "-14px" : "-4px";
        dot.style.marginTop = interactive ? "-14px" : "-4px";
        dot.style.borderColor = interactive
          ? "rgba(217, 70, 239, 0.9)"
          : "rgba(255,255,255,0.85)";
      }

      if (running) {
        raf = requestAnimationFrame(tick);
      } else {
        stopWhenSettled();
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dotX = mouseX;
      dotY = mouseY;
      if (!visible) {
        visible = true;
        glow.style.opacity = "1";
        dot.style.opacity = "1";
      }
      start();
      // Debounce a "settle" check so we don't keep the RAF alive forever
      // when the pointer is stationary.
      if (idleTimer) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        running = false;
      }, 120);
    };

    const onOver = (e: MouseEvent) => {
      // Throttle to ~60ms — hover-target detection doesn't need every event.
      const now = e.timeStamp;
      if (now - lastOverTs < 60) return;
      lastOverTs = now;
      const t = e.target as HTMLElement | null;
      interactive = !!t?.closest(
        "a,button,[role='button'],input,textarea,select,label,summary",
      );
    };

    const onLeave = () => {
      visible = false;
      glow.style.opacity = "0";
      dot.style.opacity = "0";
      running = false;
      cancelAnimationFrame(raf);
    };
    const onEnter = () => {
      visible = true;
      dot.style.opacity = "1";
      glow.style.opacity = "1";
      start();
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      cancelAnimationFrame(raf);
      if (idleTimer) window.clearTimeout(idleTimer);
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