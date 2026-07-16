// Lightweight haptic feedback helper.
// Uses the Vibration API where available (Android, some desktop browsers with
// gamepad/vibration support). Silently no-ops on iOS Safari and desktops
// without vibration hardware — that's expected, not a bug.
export type HapticPattern = "tap" | "select" | "success" | "warn";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 8,
  select: 12,
  success: [10, 40, 15],
  warn: [20, 30, 20],
};

export function haptic(pattern: HapticPattern = "tap") {
  if (typeof window === "undefined") return;
  const nav = window.navigator as Navigator & {
    vibrate?: (pattern: number | number[]) => boolean;
  };
  try {
    nav.vibrate?.(PATTERNS[pattern]);
  } catch {
    // ignore
  }
}