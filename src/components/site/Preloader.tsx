import { useEffect, useRef, useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";

const GOLD = "#b8965a";

export function Preloader() {
  const hydrated = useHydrated();
  const [alreadySeen, setAlreadySeen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAlreadySeen(window.sessionStorage.getItem("lyra_preloader_seen") === "true");
  }, []);

  useEffect(() => {
    if (alreadySeen) return;
    const t1 = setTimeout(() => setFade(true), 2400);
    const t2 = setTimeout(() => {
      setVisible(false);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("lyra_preloader_seen", "true");
      }
    }, 2950);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [alreadySeen]);

  if (!hydrated || alreadySeen || !visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden bg-[#050505] transition-opacity duration-[550ms] ease-out ${
        fade ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
      style={{
        backgroundImage:
          "radial-gradient(1200px 700px at 50% 55%, rgba(184,150,90,0.06), transparent 60%), radial-gradient(900px 600px at 50% 100%, rgba(184,150,90,0.04), transparent 70%)",
      }}
    >
      {/* Faint film grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />

      <WaveCanvas />

      <main className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center">
          <StringsMark />
          <h1
            className="mt-4 select-none text-[clamp(2.6rem,7vw,5.25rem)] font-light leading-none text-[#efe7d6]"
            style={{
              fontFamily:
                "'Cormorant Garamond', 'EB Garamond', Garamond, 'Times New Roman', serif",
              letterSpacing: "0.22em",
            }}
          >
            {"emailsly".split("").map((ch, i) => (
              <span
                key={i}
                className="inline-block opacity-0"
                style={{
                  animation: `lyra-letter-in 900ms cubic-bezier(0.2,0.7,0.2,1) forwards`,
                  animationDelay: `${180 + i * 90}ms`,
                }}
              >
                {ch}
              </span>
            ))}
          </h1>
          <p
            className="mt-5 text-[11px] uppercase text-[#8a7b5e] opacity-0"
            style={{
              letterSpacing: "0.42em",
              fontFamily: "'Inter', system-ui, sans-serif",
              animation: "lyra-fade-in 900ms ease-out 1200ms forwards",
            }}
          >
            Data, composed.
          </p>

          {/* Hairline progress */}
          <div className="mt-9 h-px w-[220px] overflow-hidden bg-[#b8965a]/15">
            <div
              className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#b8965a] to-transparent"
              style={{ animation: "lyra-progress 1.8s ease-in-out infinite" }}
            />
          </div>
        </div>
      </main>

      <p
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-[10px] text-[#5a5040] opacity-0"
        style={{
          letterSpacing: "0.4em",
          fontFamily: "'Inter', system-ui, sans-serif",
          animation: "lyra-fade-in 900ms ease-out 1600ms forwards",
        }}
      >
        LYRADATA.COM
      </p>

      <style>{`
        @keyframes lyra-letter-in {
          0% { opacity: 0; transform: translateY(14px); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes lyra-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lyra-progress {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(320%); }
        }
        @keyframes lyra-string-in {
          0% { transform: scaleY(0); opacity: 0; }
          100% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function StringsMark() {
  const heights = [22, 32, 44, 44, 34, 24, 16];
  const opacities = [0.28, 0.5, 0.85, 1, 0.6, 0.38, 0.22];
  return (
    <div className="flex items-end gap-[3px]" aria-hidden>
      {heights.map((h, i) => (
        <svg
          key={i}
          width="6"
          height={h}
          viewBox={`0 0 6 ${h}`}
          style={{
            transformOrigin: "bottom center",
            opacity: 0,
            animation: `lyra-string-in 700ms cubic-bezier(0.2,0.8,0.2,1) forwards`,
            animationDelay: `${i * 70}ms`,
          }}
        >
          <rect x="2" y="0" width="2" height={h} rx="1" fill={GOLD} opacity={opacities[i]} />
        </svg>
      ))}
    </div>
  );
}

function WaveCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const lines = 7;
    const start = performance.now();

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < lines; i++) {
        const yBase = height * 0.55 + (i - lines / 2) * 14;
        const amp = 18 + i * 6;
        const speed = 0.35 + i * 0.08;
        const phase = t * speed + i * 0.9;
        const alpha = 0.08 + (i / lines) * 0.22;

        ctx.beginPath();
        for (let x = 0; x <= width; x += 6) {
          const nx = x / width;
          const y =
            yBase +
            Math.sin(nx * 6.2 + phase) * amp +
            Math.sin(nx * 2.1 - phase * 0.6) * amp * 0.4;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(184,150,90,${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
