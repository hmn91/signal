import { isNoteEvent } from "@signal-app/core"
import { useCallback, useMemo } from "react"
import { useDerivedValue } from "../../../hooks/useDerivedValue"
import { useSong } from "../../../hooks/useSong"
import { usePianoRoll } from "./usePianoRoll"

export function useVisibleNoteTracks() {
  const { tracks } = useSong()
  const { selectedTrackId, notGhostTrackIds } = usePianoRoll()
  const visibleTracks = useMemo(
    () =>
      tracks.filter(
        (track) =>
          !track.isConductorTrack &&
          (track.id === selectedTrackId || !notGhostTrackIds.has(track.id)),
      ),
    [tracks, selectedTrackId, notGhostTrackIds],
  )

  return useDerivedValue(
    useCallback(
      (listener) => {
        const subscriptions = visibleTracks.flatMap((track) => [
          track.subscribeEventsChanged(isNoteEvent, listener),
          track.onChannelChanged.subscribe(listener),
        ])
        return () => subscriptions.forEach((unsubscribe) => unsubscribe())
      },
      [visibleTracks],
    ),
    useCallback(
      () =>
        visibleTracks.map((track) => ({
          trackId: track.id,
          isRhythmTrack: track.isRhythmTrack,
          notes: track.events.filter(isNoteEvent),
        })),
      [visibleTracks],
    ),
  )
}
