import { trackColorToCSSColor } from "@signal-app/core"
import { useCallback, useMemo, useSyncExternalStore } from "react"
import { defaultTrackColor } from "../../../helpers/trackColor"
import { useDerivedValue } from "../../../hooks/useDerivedValue"
import { useStores } from "../../../hooks/useStores"
import { useTrackMute } from "../../../hooks/useTrackMute"
import { TrackMute } from "../../../trackMute/TrackMute"
import { useVisibleTracks } from "./useVisibleTracks"

export function usePlaybackKeyColors(): ReadonlyMap<number, readonly string[]> {
  const { playbackNotes } = useStores()
  const notes = useSyncExternalStore(
    playbackNotes.onChanged.subscribe,
    playbackNotes.getSnapshot,
  )
  const tracks = useVisibleTracks()
  const { trackMute } = useTrackMute()
  const colors = useDerivedValue(
    useCallback(
      (listener) => {
        const subscriptions = tracks.map((track) =>
          track.onColorChanged.subscribe(listener),
        )
        return () => subscriptions.forEach((unsubscribe) => unsubscribe())
      },
      [tracks],
    ),
    useCallback(
      () =>
        new Map(
          tracks.map((track) => [
            track.id,
            trackColorToCSSColor(track.color ?? defaultTrackColor(track.id)),
          ]),
        ),
      [tracks],
    ),
  )

  return useMemo(() => {
    const byPitch = new Map<number, Map<number, string>>()
    for (const note of notes) {
      const color = colors.get(note.trackId)
      if (!color || !TrackMute.shouldPlayTrack(note.trackId)(trackMute)) {
        continue
      }
      const tracks = byPitch.get(note.noteNumber) ?? new Map<number, string>()
      tracks.set(Number(note.trackId), color)
      byPitch.set(note.noteNumber, tracks)
    }
    return new Map(
      [...byPitch].map(([pitch, tracks]) => [
        pitch,
        [...tracks].sort(([a], [b]) => a - b).map(([, color]) => color),
      ]),
    )
  }, [notes, colors, trackMute])
}
