import type { Song } from "@signal-app/core"
import type { Point } from "@signal-app/geometry"
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai"
import { useCallback, useMemo } from "react"
import { fitValueRange, type ValueRange } from "../../../helpers/fitView"
import { useSong } from "../../../hooks/useSong"
import { TempoCoordTransform } from "../entities/TempoCoordTransform"
import { useTempoTickScroll } from "./useTempoEditor"
import { useTempoItems } from "./useTempoItems"

export function useTempoTransform() {
  const [fitted, setFitted] = useAtom(fittedRangeAtom)
  const { getSong } = useSong()
  const song = getSong()
  return {
    get transform() {
      // WANTFIX: Use derived atom to create TempoCoordTransform
      const { transform: tickTransform } = useTempoTickScroll()
      const canvasHeight = useAtomValue(canvasHeightAtom)
      const items = useTempoItems()
      const defaultMax = items.reduce(
        (max, item) => Math.max(max, Math.ceil(item.bpm / 40) * 40),
        320,
      )
      const range =
        fitted?.song === song ? fitted.range : { min: 0, max: defaultMax }
      const { min: minBPM, max: maxBPM } = range
      return useMemo(
        () =>
          new TempoCoordTransform(tickTransform, canvasHeight, maxBPM, minBPM),
        [tickTransform, canvasHeight, maxBPM, minBPM],
      )
    },
    // convert mouse position to the local coordinate on the canvas
    get getLocal() {
      const { scrollLeft } = useTempoTickScroll()
      return useCallback(
        (e: { offsetX: number; offsetY: number }): Point => ({
          x: e.offsetX + scrollLeft,
          y: e.offsetY,
        }),
        [scrollLeft],
      )
    },
    setCanvasHeight: useSetAtom(canvasHeightAtom),
    get fitVertical() {
      const items = useTempoItems()
      return useCallback(() => {
        const max = items.reduce(
          (max, item) => Math.max(max, item.bpm * 1.2),
          320,
        )
        setFitted({
          song,
          range: fitValueRange(
            items.map((item) => item.bpm),
            { min: 1, max },
          ),
        })
      }, [items, song, setFitted])
    },
  }
}

// atoms
const canvasHeightAtom = atom(0)
const fittedRangeAtom = atom<{ song: Song; range: ValueRange } | null>(null)
