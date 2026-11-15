import styled from "@emotion/styled"
import { Toolbar } from "@signal-app/ui"
import type { FC } from "react"
import { AutoScrollButton } from "../../../components/Toolbar/AutoScrollButton"
import { FitViewButtons } from "../../../components/Toolbar/FitViewButtons"
import { QuantizeSelector } from "../../../components/Toolbar/QuantizeSelector/QuantizeSelector"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { Localized } from "../../../localize/useLocalization"
import { useTrackScroll } from "../hooks/useTrackScroll"

const Title = styled.div`
  font-weight: bold;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 14rem;
  min-width: 3em;
  margin-left: 0.5rem;
`

const FlexibleSpacer = styled.div`
  flex-grow: 1;
`

export const ArrangeToolbar: FC = () => {
  const { fitHorizontal } = useTickScroll()
  const { fitVertical } = useTrackScroll()
  return (
    <Toolbar style={{ overflowX: "auto", flexShrink: 0 }}>
      <Title>
        <Localized name="arrangement-view" />
      </Title>

      <FlexibleSpacer />
      <FitViewButtons
        onFitHorizontal={fitHorizontal}
        onFitVertical={fitVertical}
      />

      <QuantizeSelector />

      <AutoScrollButton />
    </Toolbar>
  )
}
