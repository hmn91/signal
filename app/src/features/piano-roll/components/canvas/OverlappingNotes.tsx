import { Rectangles } from "@ryohey/webgl-react"
import { type TrackId, trackColorToVec4 } from "@signal-app/core"
import type { Rect } from "@signal-app/geometry"
import { useMemo } from "react"
import { useTickScroll } from "../../../../hooks/useTickScroll"
import { useTrackColor } from "../../../../hooks/useTrackColor"
import { noteOverlapStripes } from "../../entities/noteOverlaps"
import { useNoteCoordTransform } from "../../hooks/useNoteCoordTransform"
import { useVisibleNoteTracks } from "../../hooks/useVisibleNoteTracks"

export function OverlappingNotes() {
  const tracks = useVisibleNoteTracks()
  const { transform } = useNoteCoordTransform()
  const { tickRange } = useTickScroll()
  const groups = useMemo(() => {
    const rects = tracks.flatMap(({ trackId, notes, isRhythmTrack }) =>
      notes
        .filter((note) =>
          isRhythmTrack
            ? note.tick >=
                tickRange[0] - transform.getTick(transform.pixelsPerKey) &&
              note.tick <=
                tickRange[1] + transform.getTick(transform.pixelsPerKey)
            : note.tick + note.duration > tickRange[0] &&
              note.tick < tickRange[1],
        )
        .map((note) => ({
          ...(isRhythmTrack
            ? transform.getDrumRect(note)
            : transform.getRect(note)),
          trackId,
          noteNumber: note.noteNumber,
        })),
    )
    const groups = new Map<TrackId, Rect[]>()
    for (const { trackId, ...rect } of noteOverlapStripes(rects)) {
      const group = groups.get(trackId) ?? []
      group.push(rect)
      groups.set(trackId, group)
    }
    return groups
  }, [tracks, transform, tickRange])

  return (
    <>
      {[...groups].map(([trackId, rects]) => (
        <TrackStripes key={trackId} trackId={trackId} rects={rects} />
      ))}
    </>
  )
}

function TrackStripes({ trackId, rects }: { trackId: TrackId; rects: Rect[] }) {
  const color = useTrackColor(trackId)
  // Rectangles supports both WebGL renderers and has no hit area, so the
  // selected track's full note remains available for dragging and resizing.
  return (
    <Rectangles rects={rects} color={trackColorToVec4(color)} zIndex={3.3} />
  )
}
