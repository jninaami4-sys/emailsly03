import { useEffect, useRef, useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import preloaderAsset from "@/assets/lyradata-preloader.mp4.asset.json";

export function Preloader() {
  const hydrated = useHydrated();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [alreadySeen, setAlreadySeen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAlreadySeen(window.sessionStorage.getItem("lyra_preloader_seen") === "true");
  }, []);

  useEffect(() => {
    if (!alreadySeen) {
      const t1 = setTimeout(() => setFade(true), 2400);
      const t2 = setTimeout(() => {
        setVisible(false);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("lyra_preloader_seen", "true");
        }
      }, 2900);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [alreadySeen]);

  if (!hydrated || alreadySeen || !visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-background transition-opacity duration-500 ${
        fade ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        src={preloaderAsset.url}
        autoPlay
        muted
        playsInline
        preload="auto"
        className="pointer-events-none h-full w-full object-cover"
        aria-hidden="true"
      />

      {/* Fallback static mark if the video fails to load or is still buffering */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative flex flex-col items-center">
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
    </div>
  );
}
