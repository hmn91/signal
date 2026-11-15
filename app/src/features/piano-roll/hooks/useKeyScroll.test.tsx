import { act, cleanup, renderHook } from "@testing-library/react"
import { createStore, Provider } from "jotai"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { useKeyScroll } from "./useKeyScroll"

afterEach(cleanup)

function setup() {
  const store = createStore()
  return renderHook(
    () => {
      const {
        scaleY,
        scrollTop,
        transform,
        setCanvasHeight,
        fitVertical,
        scaleAroundPointY,
      } = useKeyScroll()
      return {
        scaleY,
        scrollTop,
        transform,
        setCanvasHeight,
        fitVertical,
        scaleAroundPointY,
      }
    },
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      ),
    },
  )
}

describe("piano roll vertical fit", () => {
  it("fits pitches with padding and centres a narrow range", () => {
    const { result } = setup()
    act(() => result.current.setCanvasHeight(320))
    act(() => result.current.fitVertical([60, 64, 72]))
    const { transform, scrollTop } = result.current
    expect(transform.getY(74) - scrollTop).toBeGreaterThanOrEqual(-1)
    expect(
      transform.getY(58) + transform.pixelsPerKey - scrollTop,
    ).toBeLessThanOrEqual(321)
    expect(transform.getY(72) - scrollTop).toBeGreaterThan(0)
  })

  it("fits all MIDI pitches below the manual zoom minimum and zooms in smoothly", () => {
    const { result } = setup()
    act(() => result.current.setCanvasHeight(200))
    act(() => result.current.fitVertical([0, 127]))
    const fitted = result.current.scaleY
    expect(fitted).toBeLessThan(0.5)
    expect(result.current.transform.getMaxY()).toBeCloseTo(200)
    expect(result.current.scrollTop).toBe(0)
    act(() => result.current.scaleAroundPointY(0.2, 100))
    expect(result.current.scaleY).toBeCloseTo(fitted * 1.2)
  })

  it("keeps an empty track finite and ignores a zero-height canvas", () => {
    const { result } = setup()
    act(() => result.current.fitVertical([]))
    expect(result.current.scaleY).toBe(1)
    act(() => result.current.setCanvasHeight(200))
    act(() => result.current.fitVertical([]))
    expect(result.current.transform.getMaxY()).toBeCloseTo(200)
    expect(result.current.scrollTop).toBe(0)
  })
})
