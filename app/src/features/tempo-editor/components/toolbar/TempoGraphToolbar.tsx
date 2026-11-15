import styled from "@emotion/styled"
import { Toolbar } from "@signal-app/ui"
import type { FC } from "react"
import { AutoScrollButton } from "../../../../components/Toolbar/AutoScrollButton"
import { FitViewButtons } from "../../../../components/Toolbar/FitViewButtons"
import { QuantizeSelector } from "../../../../components/Toolbar/QuantizeSelector/QuantizeSelector"
import { useTickScroll } from "../../../../hooks/useTickScroll"
import { Localized } from "../../../../localize/useLocalization"
import { useTempoTransform } from "../../hooks/useTempoTransform"
import { ScaleTempoButton } from "./ScaleTempoButton"
import { TempoGraphToolSelector } from "./TempoGraphToolSelector"

const Title = styled.span`
  font-weight: bold;
  margin-right: 2em;
  font-size: 1rem;
  margin-left: 0.5rem;
`

const FlexibleSpacer = styled.div`
  flex-grow: 1;
`

export const TempoGraphToolbar: FC = () => {
  const { fitHorizontal } = useTickScroll()
  const { fitVertical } = useTempoTransform()
  return (
    <Toolbar style={{ overflowX: "auto", flexShrink: 0 }}>
      <Title>
        <Localized name="tempo" />
      </Title>

      <FlexibleSpacer />

      <ScaleTempoButton />

      <TempoGraphToolSelector />
      <FitViewButtons
        onFitHorizontal={fitHorizontal}
        onFitVertical={fitVertical}
      />

      <QuantizeSelector />

      <AutoScrollButton />
    </Toolbar>
  )
}
