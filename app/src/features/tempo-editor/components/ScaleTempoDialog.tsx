import styled from "@emotion/styled"
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@signal-app/ui"
import CloseIcon from "mdi-react/CloseIcon"
import { useEffect, useId, useRef, useState } from "react"
import { Localized, useLocalization } from "../../../localize/useLocalization"
import { TempoDial } from "./TempoDial"
import { TempoValueInput } from "./TempoValueInput"

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
`

const CloseButton = styled(IconButton)`
  width: 2.75rem;
  height: 2.75rem;
  flex-shrink: 0;
  &:focus-visible { outline: 2px solid var(--color-theme); }
`

const OriginalRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  strong { color: var(--color-text); font-variant-numeric: tabular-nums; }
`

const ResetButton = styled(Button)`
  height: 2.75rem;
  flex-shrink: 0;
  border: 1px solid var(--color-divider);
`

const Fields = styled.div`
  display: flex;
  gap: 0.75rem;
  @media (max-width: 360px) { flex-direction: column; }
`

const Field = styled.div`
  flex: 1;
  min-width: 0;
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
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
  const localized = useLocalization()
  // Keep the entered field as text so clearing and typing decimals works.
  const [input, setInput] = useState({
    mode: "percent",
    value: formatValue(initialPercent),
  })
  const [editVersion, setEditVersion] = useState(0)
  const [isPointerDown, setIsPointerDown] = useState(false)
  const activePointers = useRef(new Set<number>())
  const appliedVersion = useRef(0)
  const applyRef = useRef(onApply)
  const changeInput = (mode: string, value: string) => {
    setInput({ mode, value })
    setEditVersion((version) => version + 1)
  }
  const holdPointer = (pointerId: number) => {
    activePointers.current.add(pointerId)
    setIsPointerDown(true)
  }

  useEffect(() => {
    applyRef.current = onApply
  }, [onApply])

  useEffect(() => {
    const finishPointer = (event: PointerEvent) => {
      activePointers.current.delete(event.pointerId)
      setIsPointerDown(activePointers.current.size > 0)
    }
    // Input spinners and captured dial gestures can end outside the dialog.
    window.addEventListener("pointerup", finishPointer, true)
    window.addEventListener("pointercancel", finishPointer, true)
    return () => {
      window.removeEventListener("pointerup", finishPointer, true)
      window.removeEventListener("pointercancel", finishPointer, true)
    }
  }, [])
  const value = input.value.trim() === "" ? NaN : Number(input.value)
  const rawPercent =
    input.mode === "percent" ? value : (value / referenceBpm) * 100
  // Avoid rejecting exact BPM boundaries because of floating point rounding.
  const percent = Number(rawPercent.toFixed(10))
  const bpm = input.mode === "bpm" ? value : (referenceBpm * percent) / 100
  const valid = Number.isFinite(percent) && percent >= 1 && percent <= 200
  useEffect(() => {
    if (!valid || isPointerDown || editVersion === appliedVersion.current) {
      return
    }
    const timer = window.setTimeout(() => {
      if (activePointers.current.size > 0) {
        return
      }
      appliedVersion.current = editVersion
      applyRef.current(percent)
    }, 500)
    return () => window.clearTimeout(timer)
  }, [percent, valid, editVersion, isPointerDown])

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      aria-describedby={undefined}
      style={{
        width: "min(26rem, calc(100vw - 2rem))",
        boxSizing: "border-box",
      }}
    >
      <Header onPointerDownCapture={(e) => holdPointer(e.pointerId)}>
        <DialogTitle style={{ margin: 0 }}>
          <Localized name="scale-song-tempo" />
        </DialogTitle>
        <CloseButton aria-label={localized.close} onClick={onClose}>
          <CloseIcon size={22} aria-hidden="true" />
        </CloseButton>
      </Header>
      <DialogContent style={{ marginBottom: 0, minHeight: 0 }}>
        <Controls onPointerDownCapture={(e) => holdPointer(e.pointerId)}>
          <OriginalRow>
            <span id={`${id}-original`}>
              <Localized name="tempo-at-selected-position" />:{" "}
              <strong>{referenceBpm.toFixed(2)}</strong>
            </span>
            <ResetButton onClick={() => changeInput("percent", "100")}>
              <Localized name="reset" />
            </ResetButton>
          </OriginalRow>
          <Fields>
            <Field>
              <label htmlFor={`${id}-percent`}>
                <Localized name="tempo-percentage" /> (%)
              </label>
              <TempoValueInput
                id={`${id}-percent`}
                min={1}
                max={200}
                fallback={100}
                numericValue={percent}
                unit="%"
                value={
                  input.mode === "percent"
                    ? input.value
                    : Number.isFinite(percent)
                      ? formatValue(percent)
                      : ""
                }
                onChange={(value) => changeInput("percent", value)}
                aria-invalid={!valid}
                aria-describedby={`${id}-original`}
              />
            </Field>
            <Field>
              <label htmlFor={`${id}-bpm`}>BPM</label>
              <TempoValueInput
                id={`${id}-bpm`}
                min={referenceBpm / 100}
                max={referenceBpm * 2}
                fallback={referenceBpm}
                numericValue={bpm}
                unit="BPM"
                value={
                  input.mode === "bpm"
                    ? input.value
                    : Number.isFinite(bpm)
                      ? formatValue(bpm)
                      : ""
                }
                onChange={(value) => changeInput("bpm", value)}
                aria-invalid={!valid}
                aria-describedby={`${id}-original`}
              />
            </Field>
          </Fields>
          <TempoDial
            percent={percent}
            bpm={bpm}
            onChange={(percent) => changeInput("percent", formatValue(percent))}
          />
          {valid && (minimumBpm * percent) / 100 < 60000000 / 0xffffff && (
            <output>
              <Localized name="tempo-midi-limit" />
            </output>
          )}
        </Controls>
      </DialogContent>
    </Dialog>
  )
}
