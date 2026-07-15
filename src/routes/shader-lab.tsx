import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MousePointer2 } from "lucide-react";
import { PremiumSparkles as Sparkles } from "@/components/site/PremiumIcons";

export const Route = createFileRoute("/shader-lab")({
  head: () => ({
    meta: [
      { title: "Shader Lab — EmailsLy" },
      { name: "description", content: "Interactive WebGL hero shader — a living nebula that reacts to your cursor." },
      { property: "og:title", content: "Shader Lab — EmailsLy" },
      { property: "og:description", content: "A living nebula built with WebGL 2. Move your cursor to bend the light." },
    ],
  }),
  component: ShaderLabPage,
});

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
uniform vec2 touch;
uniform int pointerCount;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)
float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(in vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
  float a=rnd(i),b=rnd(i+vec2(1,0)),c=rnd(i+vec2(0,1)),d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.;mat2 m=mat2(1.,-.5,.2,1.2);
  for(int i=0;i<5;i++){t+=a*noise(p);p*=2.*m;a*=.5;}return t;}
float clouds(vec2 p){float d=1.,t=.0;
  for(float i=.0;i<3.;i++){float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);
    t=mix(t,d,a);d=a;p*=2./(i+1.);}return t;}
void main(void){
  vec2 uv=(FC-.5*R)/MN,st=uv*vec2(2,1);
  vec2 m=(touch-.5*R)/MN;
  float influence=pointerCount>0?1.0:0.0;
  vec3 col=vec3(0);
  float bg=clouds(vec2(st.x+T*.5,-st.y));
  uv*=1.-.3*(sin(T*.2)*.5+.5);
  uv+=m*.15*influence;
  for(float i=1.;i<12.;i++){
    uv+=.1*cos(i*vec2(.1+.01*i,.8)+i*i+T*.5+.1*uv.x);
    vec2 p=uv;
    float d=length(p);
    col+=.00125/d*(cos(sin(i)*vec3(1,2,3))+1.);
    float b=noise(i+p+bg*1.731);
    col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
    col=mix(col,vec3(bg*.25,bg*.137,bg*.05),d);
  }
  O=vec4(col,1);
}`;

const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

function useShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      setSupported(false);
      return;
    }

    let raf = 0;
    let scale = Math.max(1, 0.5 * window.devicePixelRatio);
    let touch: [number, number] = [0, 0];
    let pointerCount = 0;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
      }
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "resolution");
    const uTime = gl.getUniformLocation(program, "time");
    const uTouch = gl.getUniformLocation(program, "touch");
    const uCount = gl.getUniformLocation(program, "pointerCount");

    const resize = () => {
      scale = Math.max(1, 0.5 * window.devicePixelRatio);
      canvas.width = window.innerWidth * scale;
      canvas.height = window.innerHeight * scale;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    const onMove = (e: PointerEvent) => {
      touch = [e.clientX * scale, canvas.height - e.clientY * scale];
      pointerCount = 1;
    };
    const onLeave = () => {
      pointerCount = 0;
    };

    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    const render = (now: number) => {
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, now * 1e-3);
      gl.uniform2f(uTouch, touch[0], touch[1]);
      gl.uniform1i(uCount, pointerCount);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return { canvasRef, supported };
}

const MORPHS = ["Leads", "Signals", "Intent", "Pipeline", "Revenue"];

function ShaderLabPage() {
  const { canvasRef, supported } = useShaderBackground();
  const [morphIndex, setMorphIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setMorphIndex((i) => (i + 1) % MORPHS.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Shader canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-full w-full"
        style={{ touchAction: "none" }}
        aria-hidden="true"
      />

      {/* Vignette + subtle grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]"
        aria-hidden="true"
      />

      {!supported && (
        <div className="fixed inset-0 grid place-items-center bg-black text-center">
          <p className="max-w-md px-6 text-sm text-white/70">
            WebGL 2 isn't available in this browser. Try a modern desktop browser to see the
            interactive shader.
          </p>
        </div>
      )}

      {/* Content */}
      <main className="relative z-10 flex min-h-screen flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-6 sm:px-10">
          <Link
            to="/"
            className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-white/80 transition-colors hover:text-white"
          >
            ← EmailsLy
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white/80 backdrop-blur">
            <Sparkles className="size-3" /> Shader Lab
          </span>
        </header>

        {/* Hero */}
        <section className="flex flex-1 items-center justify-center px-6 pb-24 pt-8 sm:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 backdrop-blur animate-fade-in">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/80">
                Live · WebGL 2 · GPU rendered
              </span>
            </div>

            <h1 className="font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl md:text-8xl">
              <span className="block animate-fade-in">A living universe of</span>
              <span className="relative mt-2 block">
                <span
                  key={morphIndex}
                  className="inline-block animate-fade-in bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent"
                  style={{ backgroundSize: "200% 200%" }}
                >
                  {MORPHS[morphIndex]}
                </span>
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-white/70 animate-fade-in sm:text-lg">
              Move your cursor across the screen. The nebula bends toward you — same energy we
              bring to sourcing your next 10,000 leads.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/store"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.35)]"
              >
                Browse the store
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/sample-data"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
              >
                View sample data
              </Link>
            </div>

            <div className="mt-16 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/40">
              <MousePointer2 className="size-3" /> Move cursor to interact
            </div>
          </div>
        </section>

        {/* Corner meta */}
        <div className="pointer-events-none absolute bottom-6 left-6 hidden font-mono text-[10px] uppercase tracking-widest text-white/40 sm:block">
          shader/nebula.frag · Matthias Hurrle
        </div>
        <div className="pointer-events-none absolute bottom-6 right-6 hidden font-mono text-[10px] uppercase tracking-widest text-white/40 sm:block">
          v2.026.11
        </div>
      </main>
    </div>
  );
}
