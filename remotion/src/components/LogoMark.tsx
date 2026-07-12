import { useCurrentFrame, interpolate, spring } from "remotion";

const VIOLET = "#7C3AED";
const CORAL = "#FF6B4A";
const EMERALD = "#10B981";
const INK = "#0F172A";

interface LogoMarkProps {
  frame: number;
  fps: number;
}

export const LogoMark: React.FC<LogoMarkProps> = ({ frame, fps }) => {
  const t1 = Math.max(0, frame - 0);
  const t2 = Math.max(0, frame - 8);
  const t3 = Math.max(0, frame - 16);
  const t4 = Math.max(0, frame - 24);

  const s1 = spring({ frame: t1, fps, config: { damping: 18, stiffness: 220 } });
  const s2 = spring({ frame: t2, fps, config: { damping: 18, stiffness: 220 } });
  const s3 = spring({ frame: t3, fps, config: { damping: 18, stiffness: 220 } });
  const s4 = spring({ frame: t4, fps, config: { damping: 18, stiffness: 220 } });

  const frameScale = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 20, stiffness: 180 } });
  const pulse = spring({ frame: Math.max(0, frame - 60), fps, config: { damping: 12, stiffness: 140 } });

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 24;

  // Data-node positions forming a stylized L
  const nodes = [
    { x: 56, y: 56, color: VIOLET, delay: 0 },
    { x: 56, y: 164, color: CORAL, delay: 2 },
    { x: 164, y: 164, color: EMERALD, delay: 4 },
  ];

  const orbit = {
    x: cx + 90 * Math.cos(frame * 0.05),
    y: cy + 90 * Math.sin(frame * 0.05),
  };

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        transform: `scale(${frameScale})`,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="frameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={VIOLET} stopOpacity="0.2" />
            <stop offset="100%" stopColor={CORAL} stopOpacity="0.15" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer rounded square frame */}
        <rect
          x={12}
          y={12}
          width={size - 24}
          height={size - 24}
          rx={radius}
          fill="url(#frameGradient)"
          stroke={INK}
          strokeOpacity={0.08}
          strokeWidth={1.5}
        />

        {/* Connection lines */}
        <line
          x1={nodes[0].x}
          y1={nodes[0].y}
          x2={nodes[1].x}
          y2={nodes[1].y}
          stroke={INK}
          strokeOpacity={0.12}
          strokeWidth={3}
          strokeLinecap="round"
          style={{
            opacity: s2,
            transform: `scaleX(${s2})`,
            transformOrigin: `${nodes[0].x}px ${nodes[0].y}px`,
          }}
        />
        <line
          x1={nodes[1].x}
          y1={nodes[1].y}
          x2={nodes[2].x}
          y2={nodes[2].y}
          stroke={INK}
          strokeOpacity={0.12}
          strokeWidth={3}
          strokeLinecap="round"
          style={{
            opacity: s3,
            transform: `scaleX(${s3})`,
            transformOrigin: `${nodes[1].x}px ${nodes[1].y}px`,
          }}
        />

        {/* Orbiting satellite dot */}
        <circle
          cx={orbit.x}
          cy={orbit.y}
          r={5 + pulse * 2}
          fill={VIOLET}
          opacity={0.6 + pulse * 0.4}
          style={{ filter: "url(#glow)" }}
        />

        {/* Nodes */}
        {nodes.map((node, i) => {
          const s = [s1, s2, s3][i];
          return (
            <g key={i}>
              <circle
                cx={node.x}
                cy={node.y}
                r={14 + pulse * 3}
                fill={node.color}
                opacity={0.12 + pulse * 0.08}
              />
              <circle
                cx={node.x}
                cy={node.y}
                r={8}
                fill={node.color}
                style={{
                  transform: `scale(${s})`,
                  transformOrigin: `${node.x}px ${node.y}px`,
                  filter: "url(#glow)",
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
