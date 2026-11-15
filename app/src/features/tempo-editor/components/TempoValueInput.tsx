import styled from "@emotion/styled"
import { TextField } from "@signal-app/ui"
import type { ComponentProps } from "react"
import { useLocalization } from "../../../localize/useLocalization"

const Group = styled.div`
  display: flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--color-divider);
  border-radius: 0.375rem;
  &:focus-within { border-color: var(--color-theme); }
`

const StepButton = styled.button`
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 3rem;
  padding: 0;
  flex-shrink: 0;
  border: none;
  background: var(--color-background-dark);
  color: var(--color-text);
  font-size: 1.25rem;
  cursor: pointer;
  &:hover:not(:disabled) { background: var(--color-highlight); }
  &:disabled { opacity: 0.35; cursor: default; }
  &:focus-visible { outline: 2px solid var(--color-theme); outline-offset: -2px; }
`

const Input = styled(TextField)`
  flex: 1;
  min-width: 0;
  padding: 0 0.25rem;
  border: none;
  border-radius: 0;
  text-align: center;
  font-variant-numeric: tabular-nums;
  appearance: textfield;
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button { appearance: none; margin: 0; }
`

type Props = Pick<
  ComponentProps<"input">,
  "id" | "aria-invalid" | "aria-describedby"
> & {
  value: string
  numericValue: number
  min: number
  max: number
  fallback: number
  unit: "%" | "BPM"
  onChange: (value: string) => void
}

export function TempoValueInput({
  value,
  numericValue,
  min,
  max,
  fallback,
  unit,
  onChange,
  ...props
}: Props) {
  const localized = useLocalization()
  const current = Number.isFinite(numericValue) ? numericValue : fallback
  const step = (delta: number) => {
    const next = current + delta
    // Keep exact bounds: rounding a fractional BPM minimum can fall below 1%.
    const bounded =
      next <= min ? min : next >= max ? max : Number(next.toFixed(8))
    onChange(String(bounded))
  }

  return (
    <Group>
      <StepButton
        type="button"
        aria-label={`${localized["decrease-value"]} ${unit}`}
        disabled={current <= min}
        onClick={() => step(-1)}
      >
        −
      </StepButton>
      <Input
        {...props}
        type="number"
        inputMode="decimal"
        step="any"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <StepButton
        type="button"
        aria-label={`${localized["increase-value"]} ${unit}`}
        disabled={current >= max}
        onClick={() => step(1)}
      >
        +
      </StepButton>
    </Group>
  )
}
