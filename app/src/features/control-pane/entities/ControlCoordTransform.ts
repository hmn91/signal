import type { Point, Rect } from "@signal-app/geometry"
import type { TickTransform } from "../../../entities/transform/TickTransform"
import type { ValueRange } from "../../../helpers/fitView"
import type { ItemValue } from "../components/LineGraph/LineGraph"
import type { ControlSelection } from "./ControlSelection"

export class ControlCoordTransform {
  constructor(
    private readonly transform: TickTransform,
    readonly maxValue: number,
    readonly height: number,
    readonly lineWidth: number,
    readonly displayRange: ValueRange = { min: 0, max: maxValue },
  ) {}

  getX(tick: number) {
    return this.transform.getX(tick)
  }

  getTick(pixels: number) {
    return Math.floor(this.transform.getTick(pixels))
  }

  getY(value: number) {
    return (
      (1 -
        (value - this.displayRange.min) /
          (this.displayRange.max - this.displayRange.min)) *
        (this.height - this.lineWidth * 2) +
      this.lineWidth
    )
  }

  getValue(y: number) {
    return Math.max(
      0,
      Math.min(
        this.maxValue,
        Math.floor(
          this.displayRange.min +
            (1 - (y - this.lineWidth) / (this.height - this.lineWidth * 2)) *
              (this.displayRange.max - this.displayRange.min),
        ),
      ),
    )
  }

  toPosition(tick: number, value: number): Point {
    return {
      x: Math.round(this.getX(tick)),
      y: Math.round(this.getY(value)),
    }
  }

  fromPosition(position: Point): ItemValue {
    return {
      tick: this.getTick(position.x),
      value: this.getValue(position.y),
    }
  }

  transformSelection(selection: ControlSelection): Rect {
    const x = this.getX(selection.fromTick)
    return {
      x,
      y: 0,
      width: this.getX(selection.toTick) - x,
      height: this.height,
    }
  }
}
