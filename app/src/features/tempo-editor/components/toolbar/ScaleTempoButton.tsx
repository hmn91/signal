import { DEFAULT_TEMPO } from "@signal-app/player"
import {
  scaleTempoSnapshot,
  type TempoSnapshot,
} from "@signal-app/tempo-editor"
import { ToolbarButton, Tooltip } from "@signal-app/ui"
import { isEqual } from "lodash"
import ResizeIcon from "mdi-react/ResizeIcon"
import { useState } from "react"
import { useHistory } from "../../../../hooks/useHistory"
import { useStores } from "../../../../hooks/useStores"
import {
  Localized,
  useLocalization,
} from "../../../../localize/useLocalization"
import {
  getOriginalBpm,
  getTempoBaseline,
} from "../../../../services/TempoBaseline"
import { useTempoEditorService } from "../../hooks/useTempoEditor"
import { ScaleTempoDialog } from "../ScaleTempoDialog"

type Adjustment = {
  snapshot: TempoSnapshot
  referenceBpm: number
  minimumBpm: number
  initialPercent: number
}

export function ScaleTempoButton() {
  const [adjustment, setAdjustment] = useState<Adjustment | null>(null)
  const tempoEditor = useTempoEditorService()
  const { player, songStore } = useStores()
  const { pushHistory } = useHistory()
  const localized = useLocalization()

  return (
    <>
      <Tooltip title={<Localized name="scale-song-tempo" />}>
        <ToolbarButton
          aria-label={localized["scale-song-tempo"]}
          selected={adjustment !== null}
          onClick={() => {
            const snapshot = getTempoBaseline(songStore.song)
            const referenceBpm = getOriginalBpm(snapshot, player.position)
            const currentBpm =
              songStore.song.conductorTrack?.getTempo(player.position) ??
              DEFAULT_TEMPO
            setAdjustment({
              snapshot,
              referenceBpm,
              initialPercent: Number(
                ((currentBpm / referenceBpm) * 100).toFixed(4),
              ),
              minimumBpm: snapshot.reduce(
                (min, event) =>
                  Math.min(min, 60000000 / event.microsecondsPerBeat),
                snapshot.some((event) => event.tick === 0)
                  ? Infinity
                  : DEFAULT_TEMPO,
              ),
            })
          }}
        >
          <ResizeIcon size="1.2rem" aria-hidden="true" />
        </ToolbarButton>
      </Tooltip>
      {adjustment !== null && (
        <ScaleTempoDialog
          referenceBpm={adjustment.referenceBpm}
          minimumBpm={adjustment.minimumBpm}
          initialPercent={adjustment.initialPercent}
          onClose={() => setAdjustment(null)}
          onApply={(percent) => {
            if (
              isEqual(
                tempoEditor.getTempoSnapshot(),
                scaleTempoSnapshot(adjustment.snapshot, percent),
              )
            ) {
              return
            }
            pushHistory()
            tempoEditor.applyTempoSnapshot(adjustment.snapshot, percent)
            player.currentTempo =
              songStore.song.conductorTrack?.getTempo(player.position) ??
              DEFAULT_TEMPO
          }}
        />
      )}
    </>
  )
}
