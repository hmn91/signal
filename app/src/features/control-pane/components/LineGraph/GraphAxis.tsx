import styled from "@emotion/styled"
import React, { type FC } from "react"

const Parent = styled.div`
  text-align: right;
  padding-right: 0.3em;
  box-sizing: border-box;
`

const Values = styled.div`
  position: relative;
  height: 100%;
`

const Value = styled.div`
  position: absolute;
  width: 100%;
  box-sizing: border-box;
  padding: 0.3em;
  font-size: 90%;
  color: var(--color-text-secondary);

  &:hover {
    background: var(--color-highlight);
    cursor: default;
  }
`

export interface GraphAxisProps {
  width: number
  values: number[]
  valueFormatter?: (value: number) => string
  onClick: (value: number) => void
}

export const GraphAxis: FC<GraphAxisProps> = React.memo(
  ({
    width,
    values,
    valueFormatter = (v: number) => v.toString(),
    onClick,
  }) => {
    const min = values[0] ?? 0
    const max = values[values.length - 1] ?? 127
    const positionPercent = (value: number) =>
      (1 - (value - min) / (max - min || 1)) * 100
    return (
      <Parent style={{ width }}>
        <Values>
          {values
            .slice()
            .reverse()
            .map((value) => (
              <Value
                key={value}
                className="AxisValue"
                style={{
                  top: `clamp(0px, calc(${positionPercent(value)}% - 0.75rem), calc(100% - 1.5rem))`,
                }}
                onClick={() => onClick(value)}
              >
                {valueFormatter(value)}
              </Value>
            ))}
        </Values>
      </Parent>
    )
  },
)
