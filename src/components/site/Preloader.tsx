import { useEffect, useRef, useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import preloaderAsset from "@/assets/lyradata-preloader.mp4.asset.json";

export function Preloader() {
  const hydrated = useHydrated();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [alreadySeen, setAlreadySeen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [ready, setReady] = useState(false);

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
      className={`theme-midnight fixed inset-0 z-[100] grid place-items-center bg-midnight transition-opacity duration-500 ${
        fade ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      {videoFailed ? (
        <FallbackMark />
      ) : (
        <video
          ref={videoRef}
          src={preloaderAsset.url}
          autoPlay
          muted
          playsInline
          preload="auto"
          onError={() => setVideoFailed(true)}
          onLoadedData={() => setReady(true)}
          className={`pointer-events-none h-full w-full object-cover transition-opacity duration-300 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        />
      )}
      {!ready && !videoFailed && <FallbackMark />}
    </div>
  );
}


function FallbackMark() {
  return (
    <div className="relative flex flex-col items-center">
      {/* Soft ambient glow behind mark */}
      <span
        aria-hidden
        className="absolute -top-10 left-1/2 size-40 -translate-x-1/2 rounded-full bg-violet/12 blur-[70px] animate-pulse-slow"
      />

      <div className="relative grid size-20 place-items-center">
        {/* Outer orbit ring */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border border-violet/20"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, var(--violet) 25%, var(--neon-blue) 55%, transparent 70%)",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: "2px",
            animation: "loader-orbit 3s linear infinite",
          }}
        />
        {/* Inner glow shell */}
        <span
          aria-hidden
          className="absolute inset-[3px] rounded-full bg-gradient-to-br from-violet/25 via-indigo/20 to-midnight-elev backdrop-blur-sm"
        />
        {/* Core orb */}
        <span className="relative z-10 grid size-10 place-items-center rounded-full bg-gradient-to-br from-violet to-indigo shadow-[0_0_40px_-8px_var(--violet)] animate-orb-pulse">
          <span className="size-2.5 rounded-full bg-white/90" />
        </span>
      </div>

      <div className="mt-6 font-display text-2xl font-bold tracking-tight text-foreground">
        LYRA<span className="text-muted-foreground">DATA</span>
      </div>
      <div className="mt-2.5 flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald/70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" />
        </span>
        Loading verified data
      </div>
    </div>
  );
}
