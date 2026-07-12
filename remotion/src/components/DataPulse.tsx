import { useCurrentFrame, useVideoConfig } from "remotion";

interface DataPulseProps {
  opacity: number;
}

const VIOLET = "#7C3AED";
const CORAL = "#FF6B4A";
const EMERALD = "#10B981";
const INK = "#0F172A";

const particles = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 2 + Math.random() * 4,
  speed: 0.2 + Math.random() * 0.4,
  color: [VIOLET, CORAL, EMERALD, INK][Math.floor(Math.random() * 4)],
  opacity: 0.15 + Math.random() * 0.25,
}));

export const DataPulse: React.FC<DataPulseProps> = ({ opacity }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        pointerEvents: "none",
      }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        {particles.map((p) => {
          const y = ((p.y - frame * p.speed * 0.15) % 100 + 100) % 100;
          return (
            <circle
              key={p.id}
              cx={`${p.x}%`}
              cy={`${y}%`}
              r={p.size}
              fill={p.color}
              opacity={p.opacity}
            />
          );
        })}
      </svg>
    </div>
  );
};
