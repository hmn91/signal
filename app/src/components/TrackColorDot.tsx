import { type TrackId, trackColorToCSSColor } from "@signal-app/core"
import { useTrackColor } from "../hooks/useTrackColor"

export function TrackColorDot({ trackId }: { trackId: TrackId }) {
  const color = useTrackColor(trackId)
  return (
    <span
      aria-hidden="true"
      style={{
        width: "0.65rem",
        height: "0.65rem",
        borderRadius: "50%",
        marginRight: "0.5rem",
        flexShrink: 0,
        background: trackColorToCSSColor(color),
      }}
    />
  )
}
