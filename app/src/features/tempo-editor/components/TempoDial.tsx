import styled from "@emotion/styled"
import { useRef } from "react"
import { useLocalization } from "../../../localize/useLocalization"
import { tempoScaleColor } from "../helpers/tempoScaleColor"

const Dial = styled.div`
  position: relative;
  align-self: center;
  width: min(100%, 18rem);
  aspect-ratio: 1;
  flex-shrink: 0;
  border-radius: 50%;
  touch-action: none;
  user-select: none;
  cursor: grab;
  outline: none;

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

const clamp = (value: number) =>
  Math.min(200, Math.max(1, Math.round(value * 10) / 10))

const ticks = [1, ...Array.from({ length: 20 }, (_, index) => (index + 1) * 10)]
const scalePosition = (value: number) =>
  (value - 100) / (value < 100 ? 99 : 100)

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
  const colour = tempoScaleColor(value)
  const drag = useRef<{
    id: number
    lastAngle: number | null
    position: number
  } | null>(null)
  // Split the two halves so exactly 100%, rather than 100.5%, is at 12 o'clock.
  const position = scalePosition(value)
  const angle = position * 135
  const change = (next: number) => onChange(clamp(next))

  return (
    <Dial
      style={{ color: colour }}
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
      <svg viewBox="0 0 240 240" aria-hidden="true">
        {ticks.map((tick) => {
          const major = tick === 1 || tick % 50 === 0
          const tickAngle = scalePosition(tick) * 135
          return (
            <g key={tick} data-tempo-tick={tick}>
              <line
                x1={120}
                y1={14}
                x2={120}
                y2={major ? 27 : 21}
                stroke="var(--color-text-secondary)"
                strokeWidth={major ? 1.5 : 1}
                opacity={major ? 0.9 : 0.5}
                transform={`rotate(${tickAngle} 120 120)`}
              />
              {major && (
                <text
                  x={120 + Math.sin((tickAngle * Math.PI) / 180) * 115}
                  y={120 - Math.cos((tickAngle * Math.PI) / 180) * 115}
                  dy="0.35em"
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={tick === 100 ? 700 : 400}
                  fill="var(--color-text-secondary)"
                >
                  {tick}%
                </text>
              )}
            </g>
          )
        })}
        <path
          d="M57.77 182.23 A88 88 0 1 1 182.23 182.23"
          pathLength={2}
          fill="none"
          stroke="var(--color-divider)"
          strokeWidth={8}
          strokeLinecap="round"
        />
        <path
          d="M57.77 182.23 A88 88 0 1 1 182.23 182.23"
          pathLength={2}
          fill="none"
          stroke="currentColor"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${position + 1} 2`}
        />
        <circle
          cx={120}
          cy={120}
          r={68}
          fill="var(--color-background-dark)"
          stroke="var(--color-divider)"
          strokeWidth={1.5}
        />
        <circle
          cx={120}
          cy={120}
          r={62}
          fill="var(--color-background)"
          stroke="var(--color-divider)"
        />
        <line
          data-tempo-indicator="true"
          x1={120}
          y1={62}
          x2={120}
          y2={80}
          stroke="currentColor"
          strokeWidth={5}
          strokeLinecap="round"
          transform={`rotate(${angle} 120 120)`}
        />
      </svg>
    </Dial>
  )
}
