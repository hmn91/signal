import styled from "@emotion/styled"
import { useRef } from "react"
import { useLocalization } from "../../../localize/useLocalization"

const Dial = styled.div`
  position: relative;
  align-self: center;
  width: 13rem;
  height: 13rem;
  border-radius: 50%;
  touch-action: none;
  user-select: none;
  cursor: grab;
  outline: none;
  background: radial-gradient(circle, var(--color-background) 48%, var(--color-divider) 100%);

  &:focus-visible { box-shadow: 0 0 0 3px var(--color-theme); }
  &:active { cursor: grabbing; }
  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
`

const Readout = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
  strong { font-size: 2rem; }
  span { color: var(--color-text-secondary); }
`

const clamp = (value: number) =>
  Math.min(200, Math.max(1, Math.round(value * 10) / 10))

function getPointerAngle(target: HTMLElement, x: number, y: number) {
  const rect = target.getBoundingClientRect()
  const dx = x - (rect.left + rect.width / 2)
  const dy = y - (rect.top + rect.height / 2)
  // The angle is unstable near the centre; re-anchor on returning to the ring.
  if (Math.hypot(dx, dy) < Math.min(rect.width, rect.height) * 0.15) {
    return null
  }
  return Math.atan2(dy, dx)
}

export function TempoDial({
  percent,
  bpm,
  onChange,
}: {
  percent: number
  bpm: number
  onChange: (percent: number) => void
}) {
  const localized = useLocalization()
  const value = Number.isFinite(percent) ? clamp(percent) : 100
  const drag = useRef<{
    id: number
    lastAngle: number | null
    position: number
  } | null>(null)
  // Split the two halves so exactly 100%, rather than 100.5%, is at 12 o'clock.
  const position = (value - 100) / (value < 100 ? 99 : 100)
  const angle = position * 135
  const change = (next: number) => onChange(clamp(next))

  return (
    <Dial
      role="slider"
      tabIndex={0}
      aria-label={localized["tempo-percentage"]}
      aria-valuemin={1}
      aria-valuemax={200}
      aria-valuenow={value}
      aria-valuetext={`${value}%, ${Number.isFinite(bpm) ? bpm.toFixed(2) : "—"} BPM`}
      title={localized["tempo-dial-help"]}
      onPointerDown={(e) => {
        if (!e.isPrimary || e.button !== 0 || drag.current !== null) {
          return
        }
        e.preventDefault()
        e.currentTarget.focus({ preventScroll: true })
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = {
          id: e.pointerId,
          lastAngle: getPointerAngle(e.currentTarget, e.clientX, e.clientY),
          position,
        }
      }}
      onPointerMove={(e) => {
        const current = drag.current
        if (current?.id === e.pointerId) {
          const nextAngle = getPointerAngle(
            e.currentTarget,
            e.clientX,
            e.clientY,
          )
          if (current.lastAngle !== null && nextAngle !== null) {
            const delta = nextAngle - current.lastAngle
            // Use the shortest angular delta across atan2's -pi/pi seam.
            const rotation = Math.atan2(Math.sin(delta), Math.cos(delta))
            // Each half-turn arc (135 degrees) spans one side of 100%.
            // Retain fractional motion so slow touch movements accumulate.
            current.position = Math.min(
              1,
              Math.max(-1, current.position + rotation / (Math.PI * 0.75)),
            )
            change(100 + current.position * (current.position < 0 ? 99 : 100))
          }
          current.lastAngle = nextAngle
        }
      }}
      onPointerUp={(e) => {
        if (drag.current?.id === e.pointerId) {
          drag.current = null
          e.currentTarget.releasePointerCapture(e.pointerId)
        }
      }}
      onPointerCancel={(e) => {
        if (drag.current?.id === e.pointerId) {
          drag.current = null
        }
      }}
      onLostPointerCapture={(e) => {
        if (drag.current?.id === e.pointerId) {
          drag.current = null
        }
      }}
      onWheel={(e) => {
        if (e.deltaY !== 0) {
          change(value - Math.sign(e.deltaY))
        }
      }}
      onKeyDown={(e) => {
        const next = {
          ArrowUp: value + 1,
          ArrowRight: value + 1,
          ArrowDown: value - 1,
          ArrowLeft: value - 1,
          PageUp: value + 10,
          PageDown: value - 10,
          Home: 1,
          End: 200,
        }[e.key]
        if (next !== undefined) {
          e.preventDefault()
          e.stopPropagation()
          change(next)
        }
      }}
    >
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <path
          d="M39.19 160.81 A86 86 0 1 1 160.81 160.81"
          pathLength={2}
          fill="none"
          stroke="var(--color-divider)"
          strokeWidth={8}
          strokeLinecap="round"
        />
        <path
          d="M39.19 160.81 A86 86 0 1 1 160.81 160.81"
          pathLength={2}
          fill="none"
          stroke="var(--color-theme)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${position + 1} 2`}
        />
        <line
          x1={100}
          y1={27}
          x2={100}
          y2={43}
          stroke="var(--color-text)"
          strokeWidth={5}
          strokeLinecap="round"
          transform={`rotate(${angle} 100 100)`}
        />
      </svg>
      <Readout aria-hidden="true">
        <strong>{value}%</strong>
        <span>{Number.isFinite(bpm) ? bpm.toFixed(2) : "—"} BPM</span>
      </Readout>
    </Dial>
  )
}
