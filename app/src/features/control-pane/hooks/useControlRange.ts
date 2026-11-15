import type { Song } from "@signal-app/core"
import { atom, useAtom } from "jotai"
import { useCallback } from "react"
import { fitValueRange, type ValueRange } from "../../../helpers/fitView"
import { useSong } from "../../../hooks/useSong"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"
import { controlModeKey } from "../entities/ControlMode"
import { useControlPane } from "./useControlPane"

// Each track and controller retains its own view range within the current song.
const rangesAtom = atom<{ song: Song; ranges: Map<string, ValueRange> } | null>(
  null,
)

export function useControlRange() {
  const { controlMode } = useControlPane()
  const { selectedTrackId } = usePianoRoll()
  const { getSong } = useSong()
  const song = getSong()
  const key = `${selectedTrackId}/${controlModeKey(controlMode)}`
  const [state, setState] = useAtom(rangesAtom)
  const domain = {
    min: 0,
    max: controlMode.type === "pitchBend" ? 0x3fff : 127,
  }
  const range =
    (state?.song === song ? state.ranges.get(key) : undefined) ?? domain
  const { min, max } = domain
  const fitVertical = useCallback(
    (values: readonly number[]) => {
      const range = fitValueRange(values, { min, max })
      setState((previous) => {
        const ranges = new Map(previous?.song === song ? previous.ranges : [])
        ranges.set(key, range)
        return { song, ranges }
      })
    },
    [min, max, key, song, setState],
  )
  return { range, fitVertical }
}
