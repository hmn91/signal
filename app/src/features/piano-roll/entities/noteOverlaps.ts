import type { TrackId } from "@signal-app/core"
import type { Rect } from "@signal-app/geometry"

export type TrackNoteRect = Rect & { trackId: TrackId; noteNumber: number }

// Sweep each pitch's time intervals. Only split the sections where distinct
// tracks overlap; duplicate notes within one track still occupy a single lane.
export function noteOverlapStripes(notes: readonly TrackNoteRect[]) {
  const pitches = new Map<number, TrackNoteRect[]>()
  for (const note of notes) {
    if (note.width <= 0) {
      continue
    }
    const group = pitches.get(note.noteNumber) ?? []
    group.push(note)
    pitches.set(note.noteNumber, group)
  }
  const stripes: (Rect & { trackId: TrackId })[] = []
  for (const group of pitches.values()) {
    const edges = group
      .flatMap((note) => [
        { x: note.x, delta: 1, note },
        { x: note.x + note.width, delta: -1, note },
      ])
      .sort((a, b) => a.x - b.x)
    const active = new Map<TrackId, number>()
    let previousX = edges[0].x
    for (let i = 0; i < edges.length; ) {
      const x = edges[i].x
      if (active.size > 1 && x > previousX) {
        const ids = [...active.keys()].sort((a, b) => Number(a) - Number(b))
        const { y, height } = group[0]
        // Leave a thin border of the original note and its selection highlight.
        const inset = Math.min(1, height / 8)
        const stripeHeight = (height - inset * 2) / ids.length
        ids.forEach((trackId, lane) =>
          stripes.push({
            trackId,
            x: previousX,
            y: y + inset + lane * stripeHeight,
            width: x - previousX,
            height: stripeHeight,
          }),
        )
      }
      while (i < edges.length && edges[i].x === x) {
        const { note, delta } = edges[i++]
        const count = (active.get(note.trackId) ?? 0) + delta
        if (count > 0) {
          active.set(note.trackId, count)
        } else {
          active.delete(note.trackId)
        }
      }
      previousX = x
    }
  }
  return stripes
}
