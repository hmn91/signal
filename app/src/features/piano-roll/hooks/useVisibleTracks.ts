import { useMemo } from "react"
import { useSong } from "../../../hooks/useSong"
import { isTrackVisible } from "../entities/trackVisibility"
import { usePianoRoll } from "./usePianoRoll"

export function useVisibleTracks() {
  const { tracks } = useSong()
  const { selectedTrackId, notGhostTrackIds, hiddenTrackIds } = usePianoRoll()
  return useMemo(
    () =>
      tracks.filter(
        (track) =>
          !track.isConductorTrack &&
          isTrackVisible(
            track.id,
            selectedTrackId,
            notGhostTrackIds,
            hiddenTrackIds,
          ),
      ),
    [tracks, selectedTrackId, notGhostTrackIds, hiddenTrackIds],
  )
}
