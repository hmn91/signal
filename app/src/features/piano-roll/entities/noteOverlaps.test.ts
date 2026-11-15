import type { TrackId } from "@signal-app/core"
import { describe, expect, it } from "vitest"
import { noteOverlapStripes, type TrackNoteRect } from "./noteOverlaps"

const note = (
  trackId: number,
  x: number,
  width: number,
  pitch = 60,
): TrackNoteRect => ({
  trackId: trackId as TrackId,
  x,
  width,
  y: 100,
  height: 18,
  noteNumber: pitch,
})

describe("overlapping track notes", () => {
  it("shows all three track colors for exactly coincident notes", () => {
    const stripes = noteOverlapStripes([
      note(3, 0, 100),
      note(1, 0, 100),
      note(2, 0, 100),
    ])
    expect(stripes).toHaveLength(3)
    expect(stripes.map((stripe) => stripe.trackId)).toEqual([1, 2, 3])
    expect(stripes.map((stripe) => stripe.y)).toEqual([
      101,
      101 + 16 / 3,
      101 + 32 / 3,
    ])
    expect(
      stripes.every(
        (stripe) => stripe.width === 100 && stripe.height === 16 / 3,
      ),
    ).toBe(true)
  })

  it("splits partial overlaps only where the notes sound together", () => {
    expect(noteOverlapStripes([note(1, 0, 100), note(2, 40, 100)])).toEqual([
      { trackId: 1, x: 40, y: 101, width: 60, height: 8 },
      { trackId: 2, x: 40, y: 109, width: 60, height: 8 },
    ])
  })

  it("ignores touching ends, other pitches and duplicates within one track", () => {
    expect(
      noteOverlapStripes([note(1, 0, 20), note(2, 20, 20), note(3, 0, 40, 61)]),
    ).toEqual([])
    expect(noteOverlapStripes([note(1, 0, 40), note(1, 0, 40)])).toEqual([])
    expect(
      noteOverlapStripes([note(1, 0, 40), note(1, 0, 40), note(2, 0, 40)]),
    ).toHaveLength(2)
  })

  it("updates the stack when a third track enters and leaves", () => {
    const stripes = noteOverlapStripes([
      note(1, 0, 100),
      note(2, 0, 100),
      note(3, 25, 25),
    ])
    expect(stripes.filter((stripe) => stripe.x === 0)).toHaveLength(2)
    expect(stripes.filter((stripe) => stripe.x === 25)).toHaveLength(3)
    expect(stripes.filter((stripe) => stripe.x === 50)).toHaveLength(2)
  })
})
