import { spring, interpolate } from "remotion";

interface TextRevealProps {
  frame: number;
  fps: number;
}

const VIOLET = "#7C3AED";
const INK = "#0F172A";
const MUTED = "#64748B";

export const TextReveal: React.FC<TextRevealProps> = ({ frame, fps }) => {
  const lyraT = Math.max(0, frame - 36);
  const dataT = Math.max(0, frame - 44);
  const tagT = Math.max(0, frame - 54);

  const lyraSpring = spring({ frame: lyraT, fps, config: { damping: 20, stiffness: 180 } });
  const dataSpring = spring({ frame: dataT, fps, config: { damping: 20, stiffness: 180 } });
  const tagSpring = spring({ frame: tagT, fps, config: { damping: 22, stiffness: 160 } });

  const lyraY = interpolate(lyraSpring, [0, 1], [40, 0]);
  const dataY = interpolate(dataSpring, [0, 1], [40, 0]);
  const tagY = interpolate(tagSpring, [0, 1], [20, 0]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span
          style={{
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: INK,
            transform: `translateY(${lyraY}px)`,
            opacity: lyraSpring,
          }}
        >
          LYRA
        </span>
        <span
          style={{
            fontSize: 72,
            fontWeight: 500,
            letterSpacing: "-0.04em",
            color: MUTED,
            transform: `translateY(${dataY}px)`,
            opacity: dataSpring,
          }}
        >
          DATA
        </span>
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: VIOLET,
          transform: `translateY(${tagY}px)`,
          opacity: tagSpring,
        }}
      >
        Verified B2B Leads
      </div>
    </div>
  );
};
