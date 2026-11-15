import { emptySong } from "@signal-app/core"
import { createTempoEditor } from "@signal-app/tempo-editor"
import { afterEach, expect, it, vi } from "vitest"
import { downloadBlob } from "../helpers/Downloader"
import { getOriginalBpm, getTempoBaseline } from "../services/TempoBaseline"
import { downloadSongAsMidi } from "./downloadSongAsMidi"

vi.mock("../helpers/Downloader", () => ({ downloadBlob: vi.fn() }))
afterEach(() => {
  vi.resetAllMocks()
})

function setup() {
  const song = emptySong()
  const original = getTempoBaseline(song)
  const track = song.conductorTrack
  if (!track) {
    throw new Error("Missing conductor")
  }
  createTempoEditor(track).applyTempoSnapshot(original, 80)
  return song
}

it("rebases after handing a MIDI download to the browser", () => {
  const song = setup()
  downloadSongAsMidi(song)
  expect(downloadBlob).toHaveBeenCalledTimes(1)
  expect(getOriginalBpm(getTempoBaseline(song), 0)).toBe(96)
})

it("keeps the original when handing off the download fails", () => {
  const song = setup()
  vi.mocked(downloadBlob).mockImplementationOnce(() => {
    throw new Error("Download failed")
  })
  expect(() => downloadSongAsMidi(song)).toThrow("Download failed")
  expect(getOriginalBpm(getTempoBaseline(song), 0)).toBe(120)
})
