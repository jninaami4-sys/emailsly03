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
      <div className="relative flex flex-col items-center">
        {/* Logo mark with single rotating ring */}
        <div className="relative grid size-16 place-items-center">
          <span className="absolute inset-0 rounded-2xl border border-primary/20" />
          <span className="preloader-ring absolute inset-0 rounded-2xl border-2 border-transparent border-t-primary" />
          <span className="grid size-9 place-items-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <span className="size-2 rounded-full bg-primary-foreground" />
          </span>
        </div>

        <div className="mt-5 font-display text-xl font-bold tracking-tight text-foreground">
          LYRA<span className="text-muted-foreground">DATA</span>
        </div>

        {/* Minimal progress bars */}
        <div className="mt-4 flex items-center gap-1.5">
          <span className="preloader-bar h-1 w-1.5 rounded-full bg-primary/80 [animation-delay:0ms]" />
          <span className="preloader-bar h-1 w-1.5 rounded-full bg-primary/80 [animation-delay:120ms]" />
          <span className="preloader-bar h-1 w-1.5 rounded-full bg-primary/80 [animation-delay:240ms]" />
          <span className="preloader-bar h-1 w-1.5 rounded-full bg-primary/60 [animation-delay:360ms]" />
          <span className="preloader-bar h-1 w-1.5 rounded-full bg-primary/40 [animation-delay:480ms]" />
        </div>

        <div className="mt-3 text-xs font-medium tracking-wide text-muted-foreground">
          Loading verified data
        </div>
      </div>
    </div>
  );
}
