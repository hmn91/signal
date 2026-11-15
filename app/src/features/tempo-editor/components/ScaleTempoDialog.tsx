import styled from "@emotion/styled"
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogDescription,
  DialogTitle,
  PrimaryButton,
  TextField,
} from "@signal-app/ui"
import { useId, useState } from "react"
import { Localized } from "../../../localize/useLocalization"
import { TempoDial } from "./TempoDial"

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`

const Fields = styled.div`
  display: flex;
  gap: 1rem;

  label {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
  }

  input {
    width: 100%;
  }
`

const formatValue = (value: number) => String(Number(value.toFixed(4)))

export function ScaleTempoDialog({
  referenceBpm,
  minimumBpm = referenceBpm,
  initialPercent = 100,
  onApply,
  onClose,
}: {
  referenceBpm: number
  minimumBpm?: number
  initialPercent?: number
  onApply: (percent: number) => void
  onClose: () => void
}) {
  const id = useId()
  // Keep the entered field as text so clearing and typing decimals works.
  const [input, setInput] = useState({
    mode: "percent",
    value: formatValue(initialPercent),
  })
  const value = input.value.trim() === "" ? NaN : Number(input.value)
  const rawPercent =
    input.mode === "percent" ? value : (value / referenceBpm) * 100
  // Avoid rejecting exact BPM boundaries because of floating point rounding.
  const percent = Number(rawPercent.toFixed(10))
  const bpm = input.mode === "bpm" ? value : (referenceBpm * percent) / 100
  const valid = Number.isFinite(percent) && percent >= 1 && percent <= 200
  const apply = () => {
    if (valid) {
      onApply(percent)
      onClose()
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      style={{
        width: "min(26rem, calc(100vw - 2rem))",
        boxSizing: "border-box",
      }}
    >
      <DialogTitle>
        <Localized name="scale-song-tempo" />
      </DialogTitle>
      <DialogContent>
        <DialogDescription>
          <Localized name="scale-song-tempo-description" />
        </DialogDescription>
        <Controls>
          <div>
            <Localized name="tempo-at-selected-position" />:{" "}
            {referenceBpm.toFixed(2)} BPM
          </div>
          <TempoDial
            percent={percent}
            bpm={bpm}
            onChange={(percent) =>
              setInput({ mode: "percent", value: formatValue(percent) })
            }
          />
          <div
            style={{
              textAlign: "center",
              color: "var(--color-text-secondary)",
            }}
          >
            <Localized name="tempo-dial-help" />
          </div>
          <Fields>
            <label htmlFor={`${id}-percent`}>
              <span>
                <Localized name="tempo-percentage" /> (%)
              </span>
              <TextField
                id={`${id}-percent`}
                type="number"
                min={1}
                max={200}
                step="any"
                inputMode="decimal"
                value={
                  input.mode === "percent"
                    ? input.value
                    : Number.isFinite(percent)
                      ? formatValue(percent)
                      : ""
                }
                onChange={(e) =>
                  setInput({ mode: "percent", value: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && apply()}
                aria-invalid={!valid}
                aria-describedby={`${id}-limits`}
              />
            </label>
            <label htmlFor={`${id}-bpm`}>
              <span>BPM</span>
              <TextField
                id={`${id}-bpm`}
                inputMode="decimal"
                type="number"
                min={referenceBpm / 100}
                max={referenceBpm * 2}
                step="any"
                value={
                  input.mode === "bpm"
                    ? input.value
                    : Number.isFinite(bpm)
                      ? formatValue(bpm)
                      : ""
                }
                onChange={(e) =>
                  setInput({ mode: "bpm", value: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && apply()}
                aria-invalid={!valid}
                aria-describedby={`${id}-limits`}
              />
            </label>
          </Fields>
          <div id={`${id}-limits`}>
            1% – 200% · 100% = {referenceBpm.toFixed(2)} BPM
          </div>
          {valid && (minimumBpm * percent) / 100 < 60000000 / 0xffffff && (
            <output>
              <Localized name="tempo-midi-limit" />
            </output>
          )}
        </Controls>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setInput({ mode: "percent", value: "100" })}>
          <Localized name="reset" />
        </Button>
        <Button onClick={onClose}>
          <Localized name="cancel" />
        </Button>
        <PrimaryButton disabled={!valid} onClick={apply}>
          <Localized name="ok" />
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  )
}
