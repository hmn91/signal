import { describe, expect, it } from "vitest"
import { TickTransform } from "../entities/transform/TickTransform"
import { ControlCoordTransform } from "../features/control-pane/entities/ControlCoordTransform"
import { VelocityTransform } from "../features/control-pane/entities/VelocityTransform"
import { TempoCoordTransform } from "../features/tempo-editor/entities/TempoCoordTransform"
import { fitValueRange, rangeTicks } from "./fitView"

describe("vertical fitting", () => {
  it("pads the current content and keeps empty and constant graphs usable", () => {
    expect(fitValueRange([60, 100], { min: 0, max: 127 })).toEqual({
      min: 56,
      max: 104,
    })
    expect(fitValueRange([], { min: 0, max: 127 })).toEqual({
      min: 0,
      max: 127,
    })
    expect(fitValueRange([64, 64], { min: 0, max: 127 })).toEqual({
      min: 61,
      max: 67,
    })
    expect(fitValueRange([0, 127], { min: 0, max: 127 })).toEqual({
      min: 0,
      max: 127,
    })
    expect(rangeTicks({ min: 61, max: 67 })).toEqual([61, 63, 64, 66, 67])
  })

  it("maps fitted controller and pitch values back to the correct MIDI values", () => {
    const controller = new ControlCoordTransform(
      new TickTransform(1),
      127,
      200,
      2,
      { min: 60, max: 100 },
    )
    expect(controller.getValue(controller.getY(80))).toBe(80)
    expect(controller.getValue(-1000)).toBe(127)
    expect(controller.maxValue).toBe(127)
    const pitch = new ControlCoordTransform(
      new TickTransform(1),
      16383,
      200,
      2,
      { min: 8000, max: 9000 },
    )
    expect(pitch.fromPosition(pitch.toPosition(100, 8500))).toEqual({
      tick: 100,
      value: 8500,
    })
  })

  it("keeps velocity editing aligned after fitting, including soft notes", () => {
    const velocity = new VelocityTransform(200, 90, 110)
    expect(velocity.getY(100)).toBe(100)
    expect(velocity.getVelocity(100)).toBe(100)
    expect(velocity.getHeight(80)).toBe(0)
    const soft = new VelocityTransform(200, 0, 4)
    expect(soft.getHeight(1)).toBe(50)
    expect(soft.getVelocity(soft.getY(1))).toBe(1)
  })

  it("keeps tempo editing and dragging aligned with a nonzero minimum BPM", () => {
    const tempo = new TempoCoordTransform(new TickTransform(0.5), 200, 150, 50)
    expect(tempo.getY(100)).toBe(100)
    expect(tempo.getBPM(100)).toBe(100)
    expect(tempo.getDeltaBPM(20)).toBe(-10)
    expect(tempo.fromPosition({ x: 50, y: 100 })).toEqual({
      tick: 100,
      bpm: 100,
    })
  })
})
