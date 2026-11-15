import { act, cleanup, renderHook } from "@testing-library/react"
import { createStore, Provider } from "jotai"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createTickScrollScope, useTickScroll } from "./useTickScroll"

const song = vi.hoisted(() => ({
  timebase: 480,
  tracks: [{ endOfTrack: 4800000 }, { endOfTrack: 9600000 }],
}))
vi.mock("./useSong", () => ({ useSong: () => ({ getSong: () => song }) }))
afterEach(cleanup)

describe("horizontal song fit", () => {
  it("fits the entire song from zero even below the manual zoom minimum", () => {
    const store = createStore()
    const { result } = renderHook(
      () => {
        const {
          fitHorizontal,
          setCanvasWidth,
          scaleX,
          transform,
          autoScroll,
          scrollLeft,
          scaleAroundPointX,
        } = useTickScroll()
        return {
          fitHorizontal,
          setCanvasWidth,
          scaleX,
          transform,
          autoScroll,
          scrollLeft,
          scaleAroundPointX,
        }
      },
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    )
    act(() => result.current.setCanvasWidth(600))
    act(() => result.current.fitHorizontal())
    expect(result.current.scaleX).toBeLessThan(0.15)
    expect(result.current.transform.getX(9600000 + 480)).toBeCloseTo(600)
    expect(result.current.scrollLeft).toBe(0)
    expect(result.current.autoScroll).toBe(false)
    const fitted = result.current.scaleX
    act(() => result.current.scaleAroundPointX(0.2, 0))
    expect(result.current.scaleX).toBeCloseTo(fitted * 1.2)
  })

  it("does not change the zoom of other editor scopes", () => {
    const store = createStore()
    const piano = createTickScrollScope(store)
    const tempo = createTickScrollScope(store)
    const { result } = renderHook(() => {
      const p = useTickScroll(piano)
      const t = useTickScroll(tempo)
      return {
        piano: {
          fit: p.fitHorizontal,
          setWidth: p.setCanvasWidth,
          scale: p.scaleX,
        },
        tempoScale: t.scaleX,
      }
    })
    act(() => result.current.piano.setWidth(600))
    act(() => result.current.piano.fit())
    expect(result.current.piano.scale).toBeLessThan(0.15)
    expect(result.current.tempoScale).toBe(1)
  })
})
