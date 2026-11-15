import { emptySong, songToMidi } from "@signal-app/core"
import { createTempoEditor } from "@signal-app/tempo-editor"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { writeFile } from "../services/fs-helper"
import { getOriginalBpm, getTempoBaseline } from "../services/TempoBaseline"
import { saveFile, saveFileAs, songFromArrayBuffer } from "./file"

vi.mock("./song", () => ({ useSetSong: vi.fn() }))
vi.mock("../services/fs-helper", () => ({ writeFile: vi.fn() }))

beforeEach(() => {
  vi.mocked(writeFile).mockResolvedValue(undefined)
  vi.spyOn(window, "alert").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

function setup() {
  const song = emptySong()
  const original = getTempoBaseline(song)
  const track = song.conductorTrack
  if (!track) {
    throw new Error("Missing conductor")
  }
  const editor = createTempoEditor(track)
  editor.applyTempoSnapshot(original, 80)
  song.fileHandle = { name: "example.mid" } as FileSystemFileHandle
  return { song, editor, original }
}

describe("MIDI save tempo baseline", () => {
  it("captures the original tempo when a MIDI is opened", () => {
    const { song } = setup()
    const bytes = songToMidi(song)
    const opened = songFromArrayBuffer(new Uint8Array(bytes).buffer)
    const track = opened.conductorTrack
    if (!track) {
      throw new Error("Missing conductor")
    }
    const editor = createTempoEditor(track)
    editor.setBpm(editor.listItems()[0].id, 60)
    expect(getOriginalBpm(getTempoBaseline(opened), 0)).toBe(96)
  })

  it("rebases only after a successful write and uses the data actually written", async () => {
    const { song, editor, original } = setup()
    let finish: () => void = () => {}
    vi.mocked(writeFile).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )
    const pending = saveFile(song)
    expect(getOriginalBpm(getTempoBaseline(song), 0)).toBe(120)
    editor.applyTempoSnapshot(original, 60)
    finish()
    await pending
    expect(getOriginalBpm(getTempoBaseline(song), 0)).toBe(96)
    expect(song.conductorTrack?.getTempo(0)).toBeCloseTo(72, 3)
  })

  it("does not rebase after write failure", async () => {
    const { song } = setup()
    vi.mocked(writeFile).mockRejectedValueOnce(new Error("Disk full"))
    await saveFile(song)
    expect(getOriginalBpm(getTempoBaseline(song), 0)).toBe(120)
  })

  it("does not rebase when Save As is cancelled", async () => {
    const { song } = setup()
    window.showSaveFilePicker = vi
      .fn()
      .mockRejectedValue(new DOMException("Cancelled", "AbortError"))
    await saveFileAs(song)
    expect(writeFile).not.toHaveBeenCalled()
    expect(getOriginalBpm(getTempoBaseline(song), 0)).toBe(120)
  })

  it("rebases on successful Save As", async () => {
    const { song } = setup()
    window.showSaveFilePicker = vi.fn().mockResolvedValue({ name: "new.mid" })
    await saveFileAs(song)
    expect(getOriginalBpm(getTempoBaseline(song), 0)).toBe(96)
  })
})
