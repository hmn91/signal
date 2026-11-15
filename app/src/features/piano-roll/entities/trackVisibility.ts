import type { TrackId } from "@signal-app/core"

export function isTrackVisible(
  trackId: TrackId,
  selectedTrackId: TrackId,
  notGhostTrackIds: ReadonlySet<TrackId>,
  hiddenTrackIds: ReadonlySet<TrackId>,
) {
  return (
    !hiddenTrackIds.has(trackId) &&
    (trackId === selectedTrackId || !notGhostTrackIds.has(trackId))
  )
}
