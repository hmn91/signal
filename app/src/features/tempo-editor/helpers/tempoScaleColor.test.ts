import { describe, expect, it } from "vitest"
import { tempoScaleColor } from "./tempoScaleColor"

describe("tempo scale colours", () => {
  it.each([
    [0, "hsl(120, 75%, 50%)"],
    [50, "hsl(90, 75%, 50%)"],
    [100, "hsl(60, 75%, 50%)"],
    [150, "hsl(30, 75%, 50%)"],
    [200, "hsl(0, 75%, 50%)"],
  ])("interpolates %s percent from green through yellow to red", (percent, colour) => {
    expect(tempoScaleColor(percent)).toBe(colour)
  })

  it("bounds the colour range and handles incomplete input", () => {
    expect(tempoScaleColor(-10)).toBe(tempoScaleColor(0))
    expect(tempoScaleColor(220)).toBe(tempoScaleColor(200))
    expect(tempoScaleColor(NaN)).toBe(tempoScaleColor(100))
  })
})
