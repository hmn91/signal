import { isNoteEvent } from "@signal-app/core"
import { FitViewButtons } from "../../../../components/Toolbar/FitViewButtons"
import { useTickScroll } from "../../../../hooks/useTickScroll"
import { useKeyScroll } from "../../hooks/useKeyScroll"
import { useVisibleTracks } from "../../hooks/useVisibleTracks"

export function PianoRollFitButtons() {
  const { fitHorizontal } = useTickScroll()
  const { fitVertical } = useKeyScroll()
  const visibleTracks = useVisibleTracks()
  return (
    <FitViewButtons
      onFitHorizontal={fitHorizontal}
      onFitVertical={() => {
        const pitches = visibleTracks.flatMap((track) =>
          track.events.filter(isNoteEvent).map((note) => note.noteNumber),
        )
        fitVertical(pitches)
      }}
    />
  )
}
