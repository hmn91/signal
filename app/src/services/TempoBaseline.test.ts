import { emptySong, Song, SongStore } from "@signal-app/core"
import { createTempoEditor } from "@signal-app/tempo-editor"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AutoSaveService } from "./AutoSaveService"
import {
  captureTempoSnapshot,
  commitTempoBaseline,
  getOriginalBpm,
  getTempoBaseline,
  shareTempoBaseline,
} from "./TempoBaseline"

afterEach(() => {
  vi.useRealTimers()
  localStorage.clear()
})

describe("tempo baseline lifecycle", () => {
  it("keeps the original through edits and shares later saves with undo instances", () => {
    const song = emptySong()
    const original = getTempoBaseline(song)
    const restored = Song.deserialize(song.serialize())
    shareTempoBaseline(song, restored)
    const track = song.conductorTrack
    if (!track) {
      throw new Error("Missing conductor")
    }
    createTempoEditor(track).applyTempoSnapshot(original, 80)
    expect(getOriginalBpm(getTempoBaseline(song), 0)).toBe(120)
    const saved = captureTempoSnapshot(song)
    commitTempoBaseline(song, saved)
    expect(getOriginalBpm(getTempoBaseline(restored), 0)).toBe(96)
    const anotherFile = emptySong()
    expect(getOriginalBpm(getTempoBaseline(anotherFile), 0)).toBe(120)
  })

  it("keeps the original through autosave and recovery without rebasing it", () => {
    vi.useFakeTimers()
    const store = new SongStore()
    const song = store.song
    const original = getTempoBaseline(song)
    const track = song.conductorTrack
    if (!track) {
      throw new Error("Missing conductor")
    }
    createTempoEditor(track).applyTempoSnapshot(original, 50)
    const service = new AutoSaveService(store)
    service.startAutoSave()
    vi.advanceTimersByTime(10000)
    service.stopAutoSave()
    const recovered = service.restore()
    expect(recovered?.conductorTrack?.getTempo(0)).toBe(60)
    if (!recovered) {
      throw new Error("Missing recovery")
    }
    expect(getOriginalBpm(getTempoBaseline(recovered), 0)).toBe(120)
  })
})
