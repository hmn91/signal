import { isNoteEvent } from "@signal-app/core"
import { FitViewButtons } from "../../../../components/Toolbar/FitViewButtons"
import { useSong } from "../../../../hooks/useSong"
import { useTickScroll } from "../../../../hooks/useTickScroll"
import { useKeyScroll } from "../../hooks/useKeyScroll"
import { usePianoRoll } from "../../hooks/usePianoRoll"

export function PianoRollFitButtons() {
  const { fitHorizontal } = useTickScroll()
  const { fitVertical } = useKeyScroll()
  const { getSong } = useSong()
  const { selectedTrackId, notGhostTrackIds } = usePianoRoll()
  return (
    <FitViewButtons
      onFitHorizontal={fitHorizontal}
      onFitVertical={() => {
        const pitches = getSong()
          .tracks.filter(
            (track) =>
              !track.isConductorTrack &&
              (track.id === selectedTrackId || !notGhostTrackIds.has(track.id)),
          )
          .flatMap((track) =>
            track.events.filter(isNoteEvent).map((note) => note.noteNumber),
          )
        fitVertical(pitches)
      }}
    />
  )
}
