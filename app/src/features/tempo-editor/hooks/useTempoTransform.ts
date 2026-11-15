import type { Point } from "@signal-app/geometry"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useCallback, useMemo } from "react"
import { TempoCoordTransform } from "../entities/TempoCoordTransform"
import { useTempoTickScroll } from "./useTempoEditor"
import { useTempoItems } from "./useTempoItems"

export function useTempoTransform() {
  return {
    get transform() {
      // WANTFIX: Use derived atom to create TempoCoordTransform
      const { transform: tickTransform } = useTempoTickScroll()
      const canvasHeight = useAtomValue(canvasHeightAtom)
      const items = useTempoItems()
      const maxBPM = items.reduce(
        (max, item) => Math.max(max, Math.ceil(item.bpm / 40) * 40),
        320,
      )
      return useMemo(
        () => new TempoCoordTransform(tickTransform, canvasHeight, maxBPM),
        [tickTransform, canvasHeight, maxBPM],
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
  }
}

// atoms
const canvasHeightAtom = atom(0)
