/** MIDI tempo values are kept verbatim so 100% restores the exact original map. */
export type TempoSnapshot = readonly {
  tick: number
  microsecondsPerBeat: number
}[]

export function scaleTempoSnapshot(
  snapshot: TempoSnapshot,
  percent: number,
): TempoSnapshot {
  if (!Number.isFinite(percent) || percent < 1 || percent > 200) {
    throw new RangeError("Tempo percentage must be between 1 and 200")
  }
  const source = [...snapshot]
  if (percent !== 100 && !source.some((event) => event.tick === 0)) {
    source.unshift({ tick: 0, microsecondsPerBeat: 500000 })
  }
  return source.map((event) => ({
    tick: event.tick,
    microsecondsPerBeat: Math.max(
      1,
      Math.round((event.microsecondsPerBeat * 100) / percent),
    ),
  }))
}
