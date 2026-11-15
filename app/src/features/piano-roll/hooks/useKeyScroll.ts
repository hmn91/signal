import { atom, type SetStateAction, useAtomValue, useSetAtom } from "jotai"
import { clamp } from "lodash"
import { Layout } from "../../../Constants"
import { KeyTransform } from "../entities/KeyTransform"

const SCALE_Y_MIN = 0.5
const SCALE_Y_MAX = 4

export function useKeyScroll() {
  return {
    get contentHeight(): number {
      return useAtomValue(contentHeightAtom)
    },
    get scrollTop() {
      return useAtomValue(scrollTopInPixelsAtom)
    },
    get scrollTopKeys() {
      return useAtomValue(scrollTopKeysAtom)
    },
    get scaleY() {
      return useAtomValue(scaleYAtom)
    },
    get canvasHeight() {
      return useAtomValue(canvasHeightAtom)
    },
    get transform() {
      return useAtomValue(transformAtom)
    },
    setScrollTopInPixels: useSetAtom(scrollTopInPixelsAtom),
    setScrollTopInKeys: useSetAtom(scrollTopKeysAtom),
    setCanvasHeight: useSetAtom(canvasHeightAtom),
    setScaleY: useSetAtom(scaleYAtom),
    scaleAroundPointY: useSetAtom(scaleAroundPointYAtom),
    fitVertical: useSetAtom(fitVerticalAtom),
  }
}

// atoms
const canvasHeightAtom = atom(0)
const scaleYAtom = atom(1)
const scrollTopKeysAtom = atom(70) // Default to middle of the piano roll

// derived atoms
const transformAtom = atom(
  (get) => new KeyTransform(Layout.keyHeight * get(scaleYAtom), 127),
)
const scrollTopInPixelsAtom = atom(
  (get) => Math.round(get(transformAtom).getY(get(scrollTopKeysAtom))),
  (get, set, value: SetStateAction<number>) => {
    const y =
      typeof value === "function" ? value(get(scrollTopInPixelsAtom)) : value
    const transform = get(transformAtom)
    const canvasHeight = get(canvasHeightAtom)
    const maxY = Math.max(0, transform.getMaxY() - canvasHeight)
    const scrollTop = clamp(y, 0, maxY)
    set(scrollTopKeysAtom, transform.getNoteNumberFractional(scrollTop))
  },
)
const contentHeightAtom = atom((get) => get(transformAtom).getMaxY())

// actions
const fitVerticalAtom = atom(null, (get, set, pitches: readonly number[]) => {
  const height = get(canvasHeightAtom)
  if (height <= 0) {
    return
  }
  let low = 127
  let high = 0
  for (const pitch of pitches) {
    low = Math.min(low, pitch)
    high = Math.max(high, pitch)
  }
  if (pitches.length === 0) {
    low = 0
    high = 127
  }
  low = Math.max(0, low - 2)
  high = Math.min(127, high + 2)
  const scale = Math.min(
    SCALE_Y_MAX,
    height / ((high - low + 1) * Layout.keyHeight),
  )
  set(scaleYAtom, scale)
  const transform = get(transformAtom)
  const contentCenter =
    (transform.getY(high) + transform.getY(low) + transform.pixelsPerKey) / 2
  set(scrollTopInPixelsAtom, contentCenter - height / 2)
})
const scaleAroundPointYAtom = atom(
  null,
  (get, set, scaleYDelta: number, pixelY: number) => {
    const transform = get(transformAtom)
    const scrollTop = get(scrollTopInPixelsAtom)
    const pixelYInKeys0 = transform.getNoteNumberFractional(scrollTop + pixelY)
    set(scaleYAtom, (prev) =>
      clamp(prev * (1 + scaleYDelta), Math.min(prev, SCALE_Y_MIN), SCALE_Y_MAX),
    )
    const updatedTransform = get(transformAtom)
    const updatedScrollTop = get(scrollTopInPixelsAtom)
    const pixelYInKeys1 = updatedTransform.getNoteNumberFractional(
      updatedScrollTop + pixelY,
    )
    const scrollInKeys = pixelYInKeys1 - pixelYInKeys0
    set(scrollTopKeysAtom, (prev) => prev - scrollInKeys)
  },
)
