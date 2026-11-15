/** Interpolate green to red through yellow, without a blue midpoint. */
export function tempoScaleColor(percent: number): string {
  const value = Number.isFinite(percent)
    ? Math.min(200, Math.max(0, percent))
    : 100
  return `hsl(${Number((120 - value * 0.6).toFixed(2))}, 75%, 50%)`
}
