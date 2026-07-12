import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { LogoMark } from "./components/LogoMark";
import { DataPulse } from "./components/DataPulse";
import { TextReveal } from "./components/TextReveal";

const { fontFamily } = loadFont("normal", {
  weights: ["700", "500"],
  subsets: ["latin"],
});

export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance: quick fade/scale-up over first 20 frames, then hold
  const intro = spring({ frame, fps, config: { damping: 22, stiffness: 180 } });

  // Ambient particles fade in slowly
  const ambientOpacity = interpolate(frame, [0, 45], [0, 0.1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        background: "linear-gradient(145deg, #FAFAFA 0%, #F5F3FF 50%, #FAFAFA 100%)",
        overflow: "hidden",
      }}
    >
      <DataPulse opacity={ambientOpacity} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
          transform: `scale(${intro * 0.12 + 0.88})`,
          opacity: interpolate(intro, [0, 1], [0.6, 1]),
        }}
      >
        <LogoMark frame={frame} fps={fps} />
        <TextReveal frame={frame} fps={fps} />
      </AbsoluteFill>

      {/* Subtle vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at center, transparent 55%, rgba(15, 23, 42, 0.04) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
