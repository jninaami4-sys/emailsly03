import { useEffect, useState } from "react";

export function Preloader() {
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFade(true), 900);
    const t2 = setTimeout(() => setVisible(false), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-background transition-opacity duration-500 ${
        fade ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      {/* Backdrop */}
      <div className="pointer-events-none absolute -left-24 top-24 size-72 animate-pulse rounded-full bg-violet-soft blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-24 size-72 animate-pulse rounded-full bg-coral-soft blur-3xl [animation-delay:400ms]" />

      <div className="relative flex flex-col items-center">
        {/* Logo mark with orbiting ring */}
        <div className="relative grid size-20 place-items-center">
          <span className="absolute inset-0 rounded-2xl border-2 border-violet/30" />
          <span className="preloader-ring absolute inset-0 rounded-2xl border-2 border-transparent border-t-violet border-r-coral" />
          <span className="grid size-11 place-items-center rounded-xl bg-violet shadow-lg shadow-violet/40">
            <span className="preloader-dot size-2.5 rounded-full bg-white" />
          </span>
        </div>

        <div className="mt-6 font-display text-2xl font-bold tracking-tight">
          LYRA<span className="text-violet">DATA</span>
        </div>

        <div className="mt-4 flex items-center gap-1">
          <span className="preloader-bar h-1 w-1.5 rounded-full bg-violet [animation-delay:0ms]" />
          <span className="preloader-bar h-1 w-1.5 rounded-full bg-violet [animation-delay:120ms]" />
          <span className="preloader-bar h-1 w-1.5 rounded-full bg-violet [animation-delay:240ms]" />
          <span className="preloader-bar h-1 w-1.5 rounded-full bg-coral [animation-delay:360ms]" />
          <span className="preloader-bar h-1 w-1.5 rounded-full bg-coral [animation-delay:480ms]" />
        </div>

        <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Loading verified data
        </div>
      </div>
    </div>
  );
}
