import type { Point } from "@signal-app/geometry"
import type { TickTransform } from "../../../entities/transform/TickTransform"

export class TempoCoordTransform {
  constructor(
    private readonly tickTransform: TickTransform,
    // The height of the drawing area of the graph
    readonly height: number,
    readonly maxBPM = 320,
    readonly minBPM = 0,
  ) {}

  getX(tick: number) {
    return this.tickTransform.getX(tick)
  }

  getY(bpm: number) {
    return (1 - (bpm - this.minBPM) / (this.maxBPM - this.minBPM)) * this.height
  }

  getMaxY() {
    return this.height
  }

  getTick(pixels: number) {
    return this.tickTransform.getTick(pixels)
  }

  getBPM(pixels: number) {
    return (
      this.minBPM + (1 - pixels / this.height) * (this.maxBPM - this.minBPM)
    )
  }

  getDeltaBPM(pixels: number) {
    return (-pixels / this.height) * (this.maxBPM - this.minBPM)
  }

  fromPosition(position: Point) {
    return {
      tick: this.getTick(position.x),
      bpm: this.getBPM(position.y),
    }
  }
}
