export type ValueRange = { min: number; max: number }

export function fitValueRange(
  values: readonly number[],
  domain: ValueRange,
): ValueRange {
  if (values.length === 0) {
    return domain
  }
  let min = domain.max
  let max = domain.min
  for (const value of values) {
    if (!Number.isFinite(value)) {
      continue
    }
    min = Math.min(min, value)
    max = Math.max(max, value)
  }
  if (min > max) {
    return domain
  }
  const padding = Math.max(
    1,
    (domain.max - domain.min) * 0.02,
    (max - min) * 0.1,
  )
  return {
    min: Math.max(domain.min, Math.floor(min - padding)),
    max: Math.min(domain.max, Math.ceil(max + padding)),
  }
}

export function rangeTicks({ min, max }: ValueRange): number[] {
  return Array.from({ length: 5 }, (_, i) =>
    Math.round(min + ((max - min) * i) / 4),
  ).filter((value, i, values) => i === 0 || value !== values[i - 1])
}
