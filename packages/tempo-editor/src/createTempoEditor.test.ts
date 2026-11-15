import { isSetTempoEvent, Track, type TrackEventOf } from "@signal-app/core"
import type { TimeSignatureEvent } from "midifile-ts"
import { describe, expect, it, vi } from "vitest"
import { createTempoEditor } from "./createTempoEditor"

describe("createTempoEditor", () => {
  it("scales the whole ritardando in one notification without moving events", () => {
    const track = new Track()
    const editor = createTempoEditor(track)
    ;[120, 108, 96, 72].forEach((bpm, i) =>
      editor.createOrUpdateItem(i * 480, bpm),
    )
    track.addEvent<TrackEventOf<TimeSignatureEvent>>({
      tick: 0,
      type: "meta",
      subtype: "timeSignature",
      numerator: 4,
      denominator: 4,
      metronome: 24,
      thirtyseconds: 8,
    })
    const original = editor.listItems()
    const nonTempoEvents = track.events.filter((e) => !isSetTempoEvent(e))
    const listener = vi.fn()
    track.onEventsChanged.subscribe(listener)

    editor.scaleAllTempos((100 / 120) * 100)

    editor.listItems().forEach((item, i) => {
      expect(item.id).toBe(original[i].id)
      expect(item.tick).toBe(original[i].tick)
      expect(item.bpm).toBeCloseTo((original[i].bpm * 100) / 120, 3)
    })
    expect(track.events.filter((e) => !isSetTempoEvent(e))).toEqual(
      nonTempoEvents,
    )
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it.each([1, 200])("supports the %s percent boundary", (percent) => {
    const editor = createTempoEditor(new Track())
    editor.createOrUpdateItem(0, 120)
    editor.scaleAllTempos(percent)
    expect(editor.listItems()[0].bpm).toBeCloseTo((120 * percent) / 100, 2)
  })

  it.each([
    { items: [] },
    { items: [{ tick: 480, bpm: 90 }] },
  ])("scales implicit default tempo before the first event", ({ items }) => {
    const editor = createTempoEditor(new Track())
    items.forEach((item) => editor.createOrUpdateItem(item.tick, item.bpm))
    editor.scaleAllTempos(50)
    expect(editor.listItems().find((item) => item.tick === 0)?.bpm).toBe(60)
    if (items.length) {
      expect(
        editor.listItems().find((item) => item.tick === 480)?.bpm,
      ).toBeCloseTo(45, 3)
    }
  })

  it("leaves a 100 percent change untouched", () => {
    const track = new Track()
    const editor = createTempoEditor(track)
    editor.createOrUpdateItem(480, 120)
    const listener = vi.fn()
    track.onEventsChanged.subscribe(listener)
    editor.scaleAllTempos(100)
    expect(listener).not.toHaveBeenCalled()
    expect(editor.listItems()).toHaveLength(1)
  })

  it.each([
    0,
    -1,
    201,
    NaN,
    Infinity,
  ])("rejects invalid percentage %s without editing", (percent) => {
    const editor = createTempoEditor(new Track())
    editor.createOrUpdateItem(0, 120)
    expect(() => editor.scaleAllTempos(percent)).toThrow(RangeError)
    expect(editor.listItems()[0].bpm).toBe(120)
  })

  it("runs a composed mutation in one transaction, emitting a single change", () => {
    const conductorTrack = new Track()
    const editor = createTempoEditor(conductorTrack)
    editor.createOrUpdateItem(10, 120)
    editor.createOrUpdateItem(20, 150)
    const ids = editor.listItems().map((item) => item.id)

    const listener = vi.fn()
    conductorTrack.onEventsChanged.subscribe(listener)

    // removes two items; without a transaction this would notify twice
    editor.removeItems(ids)

    expect(editor.listItems()).toStrictEqual([])
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
