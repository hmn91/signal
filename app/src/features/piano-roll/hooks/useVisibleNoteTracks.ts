import { isNoteEvent } from "@signal-app/core"
import { useCallback } from "react"
import { useDerivedValue } from "../../../hooks/useDerivedValue"
import { useVisibleTracks } from "./useVisibleTracks"

export function useVisibleNoteTracks() {
  const visibleTracks = useVisibleTracks()

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
