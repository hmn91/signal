import styled from "@emotion/styled"
import React, { type FC } from "react"
import { rangeTicks } from "../../../../helpers/fitView"
import { useControlRange } from "../../hooks/useControlRange"
import { GraphAxis } from "../LineGraph/GraphAxis"
import { VelocityControlCanvas } from "./VelocityControlCanvas"

export interface PianoVelocityControlProps {
  width: number
  height: number
  axisWidth: number
}

const Parent = styled.div`
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
`

const PianoVelocityControl: FC<PianoVelocityControlProps> = ({
  width,
  height,
  axisWidth,
}: PianoVelocityControlProps) => {
  const { range } = useControlRange()
  return (
    <Parent>
      <GraphAxis
        width={axisWidth}
        values={rangeTicks(range)}
        onClick={() => {}}
      />
      <VelocityControlCanvas width={width} height={height} />
    </Parent>
  )
}

export default React.memo(PianoVelocityControl)
