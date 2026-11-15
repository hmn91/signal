import { Track } from "@signal-app/core"
import { describe, expect, it, vi } from "vitest"
import { createTempoEditor } from "./createTempoEditor"
import { scaleTempoSnapshot } from "./TempoSnapshot"

describe("saved tempo snapshots", () => {
  const original = [
    { tick: 0, microsecondsPerBeat: 500000 },
    { tick: 480, microsecondsPerBeat: 666667 },
    { tick: 960, microsecondsPerBeat: 833333 },
  ]

  it("scales from the original every time and resets exactly, including rounding", () => {
    const track = new Track()
    const editor = createTempoEditor(track)
    editor.applyTempoSnapshot(original, 100)
    const ids = editor.listItems().map((item) => item.id)
    editor.applyTempoSnapshot(original, 80)
    editor.applyTempoSnapshot(original, 60)
    expect(editor.getTempoSnapshot()).toEqual(scaleTempoSnapshot(original, 60))
    expect(editor.listItems().map((item) => item.id)).toEqual(ids)
    const listener = vi.fn()
    editor.observeItems(listener)
    editor.applyTempoSnapshot(original, 100)
    expect(editor.getTempoSnapshot()).toEqual(original)
    expect(listener).toHaveBeenCalledTimes(1)
    editor.applyTempoSnapshot(original, 100)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it("restores added, deleted and duplicate tempo points and leaves other events intact", () => {
    const track = new Track()
    const editor = createTempoEditor(track)
    const snapshot = [...original, { tick: 960, microsecondsPerBeat: 900000 }]
    editor.applyTempoSnapshot(snapshot, 100)
    track.setName("Conductor")
    const name = track.name
    editor.removeItems([editor.listItems()[1].id])
    editor.createOrUpdateItem(2000, 70)
    editor.applyTempoSnapshot(snapshot, 100)
    expect(editor.getTempoSnapshot()).toEqual(snapshot)
    expect(track.name).toBe(name)
  })

  it("scales the implicit default and removes that generated event on reset", () => {
    const editor = createTempoEditor(new Track())
    const snapshot = [{ tick: 480, microsecondsPerBeat: 666667 }]
    editor.applyTempoSnapshot(snapshot, 50)
    expect(editor.getTempoSnapshot()[0]).toEqual({
      tick: 0,
      microsecondsPerBeat: 1000000,
    })
    editor.applyTempoSnapshot(snapshot, 100)
    expect(editor.getTempoSnapshot()).toEqual(snapshot)
  })

  it.each([
    NaN,
    Infinity,
    0,
    201,
  ])("rejects invalid percentage %s before editing", (percent) => {
    const editor = createTempoEditor(new Track())
    editor.applyTempoSnapshot(original, 100)
    expect(() => editor.applyTempoSnapshot(original, percent)).toThrow(
      RangeError,
    )
    expect(editor.getTempoSnapshot()).toEqual(original)
  })
})
