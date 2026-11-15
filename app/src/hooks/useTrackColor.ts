import type { TrackId } from "@signal-app/core"
import { defaultTrackColor } from "../helpers/trackColor"
import { useTrack } from "./useTrack"

export function useTrackColor(trackId: TrackId) {
  const { color } = useTrack(trackId)
  return color ?? defaultTrackColor(trackId)
}
