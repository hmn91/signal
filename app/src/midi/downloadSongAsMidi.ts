import { type Song, songToMidi } from "@signal-app/core"
import { downloadBlob } from "../helpers/Downloader"
import {
  captureTempoSnapshot,
  commitTempoBaseline,
} from "../services/TempoBaseline"

export function downloadSongAsMidi(song: Song) {
  const bytes = songToMidi(song)
  const tempoSnapshot = captureTempoSnapshot(song)
  const blob = new Blob([new Uint8Array(bytes)], {
    type: "application/octet-stream",
  })
  downloadBlob(blob, song.filepath.length > 0 ? song.filepath : "no name.mid")
  // Browser downloads have no completion callback; commit after handing off.
  commitTempoBaseline(song, tempoSnapshot)
}
