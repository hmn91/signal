import type { TrackColor, TrackId } from "@signal-app/core"
import Color from "color"

// Use identity rather than list position so reordering never changes a color.
export function defaultTrackColor(id: TrackId): TrackColor {
  const [red, green, blue] = Color.hsl(
    (210 + Number(id) * 137.508) % 360,
    70,
    60,
  )
    .rgb()
    .round()
    .array()
  return { red, green, blue, alpha: 255 }
}
