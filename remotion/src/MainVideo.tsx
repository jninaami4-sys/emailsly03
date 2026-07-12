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
  const { fps, durationInFrames } = useVideoConfig();

  const intro = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const hold = interpolate(frame, [durationInFrames - 20, durationInFrames - 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outro = 1 - hold;

  const ambientOpacity = interpolate(intro * outro, [0, 1], [0, 0.08]);

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
          transform: `scale(${intro * outro * 0.15 + 0.85})`,
          opacity: intro * outro,
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
          background: "radial-gradient(circle at center, transparent 50%, rgba(15, 23, 42, 0.04) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
