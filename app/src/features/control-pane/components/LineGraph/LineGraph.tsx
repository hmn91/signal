import React from "react"
import type { ValueRange } from "../../../../helpers/fitView"
import { useCreateOrUpdateControlEventsValue } from "../../hooks/control"
import { GraphAxis } from "./GraphAxis"
import { LineGraphCanvas } from "./LineGraphCanvas"

export interface ItemValue {
  tick: number
  value: number
}

export interface LineGraphProps {
  width: number
  height: number
  maxValue: number
  displayRange?: ValueRange
  lineWidth?: number
  circleRadius?: number
  axis: number[]
  axisWidth: number
  axisLabelFormatter?: (value: number) => string
}

const LineGraph = ({
  maxValue,
  displayRange,
  width,
  height,
  lineWidth = 2,
  circleRadius = 4,
  axis,
  axisWidth,
  axisLabelFormatter = (v) => v.toString(),
}: LineGraphProps) => {
  const createOrUpdateControlEventsValue = useCreateOrUpdateControlEventsValue()

  return (
    <div
      style={{
        display: "flex",
      }}
    >
      <GraphAxis
        width={axisWidth}
        values={axis}
        valueFormatter={axisLabelFormatter}
        onClick={createOrUpdateControlEventsValue}
      />
      <LineGraphCanvas
        width={width}
        height={height}
        maxValue={maxValue}
        displayRange={displayRange}
        lineWidth={lineWidth}
        circleRadius={circleRadius}
      />
    </div>
  )
}

export default React.memo(LineGraph)
