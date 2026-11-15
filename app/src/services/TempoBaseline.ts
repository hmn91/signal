import type { Song } from "@signal-app/core"
import { createTempoEditor, type TempoSnapshot } from "@signal-app/tempo-editor"

type TempoBaseline = { snapshot: TempoSnapshot }

// One shared baseline per open document. Undo replaces Song instances but must
// never roll back a later successful MIDI save's baseline.
const baselines = new WeakMap<Song, TempoBaseline>()

export function captureTempoSnapshot(song: Song): TempoSnapshot {
  return song.conductorTrack
    ? createTempoEditor(song.conductorTrack).getTempoSnapshot()
    : []
}

export function getTempoBaseline(song: Song): TempoSnapshot {
  let baseline = baselines.get(song)
  if (!baseline) {
    baseline = { snapshot: captureTempoSnapshot(song) }
    baselines.set(song, baseline)
  }
  return baseline.snapshot
}

export function commitTempoBaseline(song: Song, snapshot: TempoSnapshot): void {
  getTempoBaseline(song)
  const baseline = baselines.get(song)
  if (baseline) {
    baseline.snapshot = snapshot.map((event) => ({ ...event }))
  }
}

export function shareTempoBaseline(song: Song, restoredSong: Song): void {
  getTempoBaseline(song)
  const baseline = baselines.get(song)
  if (baseline) {
    baselines.set(restoredSong, baseline)
  }
}

export function getOriginalBpm(snapshot: TempoSnapshot, tick: number): number {
  let microsecondsPerBeat = 500000
  for (const event of snapshot) {
    if (event.tick > tick) {
      break
    }
    microsecondsPerBeat = event.microsecondsPerBeat
  }
  return 60000000 / microsecondsPerBeat
}
