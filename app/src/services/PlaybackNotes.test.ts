import {
  controllerMidiEvent,
  noteOffMidiEvent,
  noteOnMidiEvent,
  type TrackId,
} from "@signal-app/core"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { METRONOME_TRACK_ID } from "../player/EventSource"
import { PlaybackNotes } from "./PlaybackNotes"

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function setup() {
  const output = { activate: vi.fn(), sendEvent: vi.fn() }
  const notes = new PlaybackNotes(output)
  notes.setPlaying(true)
  return { notes, output }
}

describe("playback note timestamps", () => {
  it("lights keys at the sound timestamp, rather than when lookahead schedules them", () => {
    const { notes, output } = setup()
    const timestamp = performance.now()
    const on = noteOnMidiEvent(0, 0, 60, 100)
    const off = noteOffMidiEvent(0, 0, 60, 0)
    notes.sendEvent(on, 0.1, timestamp, 1)
    notes.sendEvent(off, 0.13, timestamp, 1)
    expect(output.sendEvent).toHaveBeenNthCalledWith(1, on, 0.1, timestamp, 1)
    expect(output.sendEvent).toHaveBeenNthCalledWith(2, off, 0.13, timestamp, 1)
    expect(notes.getSnapshot()).toEqual([])
    vi.advanceTimersByTime(99)
    expect(notes.getSnapshot()).toEqual([])
    vi.advanceTimersByTime(1)
    expect(notes.getSnapshot()).toEqual([
      { trackId: 1, channel: 0, noteNumber: 60 },
    ])
    vi.advanceTimersByTime(30)
    expect(notes.getSnapshot()).toEqual([])
  })

  it("keeps simultaneous tracks and repeated notes independent", () => {
    const { notes } = setup()
    const timestamp = performance.now()
    notes.sendEvent(noteOnMidiEvent(0, 0, 61, 100), 0, timestamp, 1)
    notes.sendEvent(noteOnMidiEvent(0, 0, 61, 100), 0, timestamp, 1)
    notes.sendEvent(noteOnMidiEvent(0, 0, 61, 100), 0, timestamp, 2)
    expect(notes.getSnapshot()).toHaveLength(2)
    notes.sendEvent(noteOffMidiEvent(0, 0, 61, 0), 0, timestamp, 1)
    expect(notes.getSnapshot()).toHaveLength(2)
    notes.sendEvent(noteOffMidiEvent(0, 0, 61, 0), 0, timestamp, 1)
    expect(notes.getSnapshot()).toEqual([
      { trackId: 2, channel: 0, noteNumber: 61 },
    ])
    notes.sendEvent(noteOnMidiEvent(0, 0, 61, 0), 0, timestamp, 2)
    expect(notes.getSnapshot()).toEqual([])
  })

  it("clears keys and pending note-ons on stop, including a quick restart", () => {
    const { notes } = setup()
    const timestamp = performance.now()
    notes.sendEvent(noteOnMidiEvent(0, 0, 60, 100), 0, timestamp, 1)
    notes.sendEvent(noteOnMidiEvent(0, 0, 64, 100), 0.1, timestamp, 1)
    notes.setPlaying(false)
    notes.setPlaying(true)
    vi.advanceTimersByTime(200)
    expect(notes.getSnapshot()).toEqual([])
  })

  it("resets a channel at a seek or loop boundary without cancelling the next notes", () => {
    const { notes } = setup()
    const timestamp = performance.now()
    notes.sendEvent(noteOnMidiEvent(0, 0, 60, 100), 0, timestamp, 1)
    notes.sendEvent(noteOnMidiEvent(0, 1, 65, 100), 0, timestamp, 2)
    notes.sendEvent(controllerMidiEvent(0, 0, 123, 0), 0.1, timestamp)
    notes.sendEvent(noteOnMidiEvent(0, 0, 62, 100), 0.1, timestamp, 1)
    vi.advanceTimersByTime(100)
    expect(notes.getSnapshot()).toEqual([
      { trackId: 2, channel: 1, noteNumber: 65 },
      { trackId: 1, channel: 0, noteNumber: 62 },
    ])
    notes.sendEvent(controllerMidiEvent(0, 0, 120, 0), 0, performance.now())
    expect(notes.getSnapshot()).toEqual([
      { trackId: 2, channel: 1, noteNumber: 65 },
    ])
  })

  it("does not light keys for metronome events, previews or paused playback", () => {
    const { notes, output } = setup()
    const on = noteOnMidiEvent(0, 9, 76, 100)
    notes.sendEvent(on, 0, performance.now(), METRONOME_TRACK_ID as TrackId)
    notes.sendEvent(on, 0, performance.now())
    notes.setPlaying(false)
    notes.sendEvent(on, 0, performance.now(), 1)
    expect(notes.getSnapshot()).toEqual([])
    expect(output.sendEvent).toHaveBeenCalledTimes(3)
  })
})
