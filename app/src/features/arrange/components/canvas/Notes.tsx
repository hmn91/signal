import { Rectangles } from "@ryohey/webgl-react"
import { type TrackId, trackColorToVec4 } from "@signal-app/core"
import type { Rect } from "@signal-app/geometry"
import { type FC, useMemo } from "react"
import { useTrackColor } from "../../../../hooks/useTrackColor"
import { useArrangeNotes } from "../../hooks/useArrangeNotes"

export const Notes: FC<{ zIndex: number }> = ({ zIndex }) => {
  const notes = useArrangeNotes()
  const groups = useMemo(() => {
    const groups = new Map<TrackId, Rect[]>()
    for (const note of notes) {
      if (note.trackId === undefined) {
        continue
      }
      const rects = groups.get(note.trackId) ?? []
      rects.push(note)
      groups.set(note.trackId, rects)
    }
    return groups
  }, [notes])
  return (
    <>
      {[...groups].map(([trackId, rects]) => (
        <TrackNotes
          key={trackId}
          trackId={trackId}
          rects={rects}
          zIndex={zIndex}
        />
      ))}
    </>
  )
}

function TrackNotes({
  trackId,
  rects,
  zIndex,
}: {
  trackId: TrackId
  rects: Rect[]
  zIndex: number
}) {
  const color = useTrackColor(trackId)
  return (
    <Rectangles rects={rects} color={trackColorToVec4(color)} zIndex={zIndex} />
  )
}
