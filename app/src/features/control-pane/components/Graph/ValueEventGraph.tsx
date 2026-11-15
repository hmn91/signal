import { ValueEventType } from "@signal-app/control-editor"
import type { Size } from "@signal-app/geometry"
import React, { type FC, useMemo } from "react"
import { rangeTicks } from "../../../../helpers/fitView"
import { useControlRange } from "../../hooks/useControlRange"
import LineGraphControl from "../LineGraph/LineGraph"

export type ValueEventGraphProps = Size & {
  type: ValueEventType
  axisWidth: number
}

const maxValueForType = (type: ValueEventType) => {
  switch (type.type) {
    case "controller":
      return 127
    case "pitchBend":
      return 0x4000
  }
}

const labelFormatterForType =
  (type: ValueEventType) =>
  (v: number): string =>
    ValueEventType.toDisplayValue(type, v).toString()

export const ValueEventGraph: FC<ValueEventGraphProps> = React.memo(
  ({ width, height, type, axisWidth }) => {
    const { range } = useControlRange()
    const axis = rangeTicks(range)
    const maxValue = useMemo(() => maxValueForType(type), [type])
    const labelFormatter = useMemo(() => labelFormatterForType(type), [type])

    return (
      <LineGraphControl
        width={width}
        height={height}
        maxValue={maxValue}
        displayRange={range}
        axis={axis}
        axisWidth={axisWidth}
        axisLabelFormatter={labelFormatter}
      />
    )
  },
)
